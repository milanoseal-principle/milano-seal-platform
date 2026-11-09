-- Forward correction to 089 under FINAL_PRODUCTION_CERTIFICATION authority.
-- Observation can authorize scheduling only; it never creates paid truth.
-- No rows rewritten, no historical migration changed, no provider action.
begin;
create or replace function public.is_valid_matter_transition(p_from text,p_to text)
returns boolean language sql immutable set search_path='' as $$
 select coalesce(case
 when p_from is null then p_to='intake_received'
 when p_from=p_to then p_to in ('intake_received','under_review','quoted','awaiting_payment','payment_confirmed','scheduled','in_execution','apostille_processing','in_transit','delivered','completed','dormant')
 when p_from='intake_received' then p_to='under_review'
 when p_from='under_review' then p_to='quoted'
 when p_from='quoted' then p_to='awaiting_payment'
 when p_from='awaiting_payment' then p_to in ('payment_confirmed','scheduled')
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
 observed_valid boolean;
 provider_valid boolean;
 target text;
begin
 settlement_verified := NEW.payment_confirmed is true
   and NEW.payment_status = 'paid' and NEW.payment_settlement_status = 'cleared'
   and NEW.amount_due > 0 and NEW.amount_paid > 0
   and NEW.amount_due::text not in ('NaN', 'Infinity', '-Infinity')
   and NEW.amount_paid::text not in ('NaN', 'Infinity', '-Infinity')
   and round(NEW.amount_paid * 100) = round(NEW.amount_due * 100);
 observed_valid := NEW.payment_confirmed is false and NEW.payment_status in ('unpaid','pending')
   and coalesce(NEW.amount_paid,0)=0 and NEW.payment_settlement_status='observed_pending'
   and NEW.payment_observed_at is not null and NEW.amount_due>0
   and NEW.amount_due::text not in ('NaN', 'Infinity', '-Infinity')
   and NEW.payment_observed_amount is not null and NEW.payment_observed_amount=NEW.amount_due
   and nullif(btrim(NEW.currency),'') is not null
   and nullif(btrim(NEW.payment_observed_currency),'') is not null
   and upper(btrim(NEW.payment_observed_currency))=upper(btrim(NEW.currency))
   and nullif(btrim(NEW.payment_observed_reference),'') is not null
   and btrim(NEW.payment_observed_reference)=coalesce(nullif(btrim(NEW.wise_reference),''),NEW.deal_id);
 provider_valid := observed_valid and nullif(btrim(NEW.wise_transaction_reference),'') is not null
   and NEW.payment_funding_method='wise_acquiring_payment';
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
     if not coalesce(settlement_verified or observed_valid,false) then raise exception 'PAYMENT_REQUIRED: canonical Wise scheduling authority required';end if;
   elsif target in ('in_execution','apostille_processing') then
     if not coalesce(settlement_verified or provider_valid,false) then raise exception 'WISE_PROVIDER_EVIDENCE_REQUIRED: execution authority required';end if;
   elsif target in ('payment_confirmed','in_transit','delivered','completed','apostille','shipped','complete') then
     if not coalesce(settlement_verified,false) then raise exception 'PAYMENT_REQUIRED: verified Wise settlement required';end if;
   end if;
 end loop;
 return NEW;
end;
$$;
-- Existing 089 triggers and append-only AFTER lifecycle auditing remain bound.
-- record_document_release / claim_final_delivery_label keep their stricter full-
-- balance, holds, review/version and settlement controls. No release overrides.
commit;
