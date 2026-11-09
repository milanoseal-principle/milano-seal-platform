-- Locked founder correction 2026-11-09: no verified Wise payment, no scheduling.
-- Forward-only; no customer stage rewrites, migrations applied or provider calls.
begin;
create or replace function public.is_valid_matter_transition(p_from text,p_to text)
returns boolean language sql immutable set search_path='' as $$
 select coalesce(case
 when p_from is null then p_to='intake_received'
 when p_from=p_to then p_to in ('intake_received','under_review','quoted','awaiting_payment','payment_confirmed','scheduled','in_execution','apostille_processing','in_transit','delivered','completed','dormant')
 when p_from='intake_received' then p_to='under_review'
 when p_from='under_review' then p_to='quoted'
 when p_from='quoted' then p_to='awaiting_payment'
 when p_from='awaiting_payment' then p_to='payment_confirmed'
 when p_from='payment_confirmed' then p_to='scheduled'
 when p_from='scheduled' then p_to='in_execution'
 when p_from='in_execution' then p_to in ('apostille_processing','in_transit')
 when p_from='apostille_processing' then p_to='in_transit'
 when p_from='in_transit' then p_to='delivered'
 when p_from='delivered' then p_to='completed'
 else false end,false);
$$;
revoke all on function public.is_valid_matter_transition(text,text) from public,anon,authenticated;
grant execute on function public.is_valid_matter_transition(text,text) to service_role;

create or replace function public.check_payment_gate()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare
 settlement_verified boolean;
 target text;
begin
 settlement_verified := NEW.payment_confirmed is true
   and NEW.payment_status = 'paid' and NEW.payment_settlement_status = 'cleared'
   and NEW.amount_due > 0 and NEW.amount_paid > 0
   and NEW.amount_due::text not in ('NaN', 'Infinity', '-Infinity')
   and NEW.amount_paid::text not in ('NaN', 'Infinity', '-Infinity')
   and round(NEW.amount_paid * 100) = round(NEW.amount_due * 100);
 -- Exact settlement advances an awaiting-payment Matter once; never regress
 -- an already scheduled/executing Matter when the later settlement arrives.
 if TG_OP='UPDATE' and settlement_verified and NEW.status='awaiting_payment' then
   NEW.status:='payment_confirmed'; NEW.deal_status:='payment_confirmed';
 end if;
 -- Financial failures/refunds must remain recordable without forcing a stage.
 if TG_OP='UPDATE' and NEW.status is not distinct from OLD.status
   and NEW.deal_status is not distinct from OLD.deal_status then return NEW;end if;
 foreach target in array array[NEW.status,NEW.deal_status] loop
   if target='scheduled' then
     if not coalesce(settlement_verified,false) then raise exception 'PAYMENT_REQUIRED: verified Wise settlement required before scheduling';end if;
   elsif target in ('in_execution','apostille_processing') then
     if not coalesce(settlement_verified,false) then raise exception 'PAYMENT_REQUIRED: verified Wise settlement required before execution';end if;
   elsif target in ('payment_confirmed','in_transit','delivered','completed','apostille','shipped','complete') then
     if not coalesce(settlement_verified,false) then raise exception 'PAYMENT_REQUIRED: verified Wise settlement required';end if;
   end if;
 end loop;
 return NEW;
end;
$$;

create or replace function public.wise_execution_authorized(d public.deals)
returns boolean language sql stable set search_path='' as $$
 select coalesce(d.payment_confirmed is true and d.payment_status='paid' and d.payment_settlement_status='cleared'
 and d.amount_due>0 and d.amount_paid>0 and d.amount_due::text not in ('NaN','Infinity','-Infinity')
 and d.amount_paid::text not in ('NaN','Infinity','-Infinity') and round(d.amount_paid*100)=round(d.amount_due*100),false);
$$;
revoke all on function public.wise_execution_authorized(public.deals) from public,anon,authenticated;
grant execute on function public.wise_execution_authorized(public.deals) to service_role;
commit;
