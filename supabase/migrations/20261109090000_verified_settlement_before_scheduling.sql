-- Founder decision 2026-11-09: NO VERIFIED WISE SETTLEMENT -> NO SCHEDULING.
-- Forward-only correction of check_payment_gate (last defined in
-- 20261109060000_wise_attempt_authority.sql). An integrity-matched Wise
-- submission (payment_settlement_status='observed_pending') or current provider
-- attempt evidence no longer authorizes the 'scheduled', 'in_execution' or
-- 'apostille_processing' stages. Only exact verified cleared settlement does.
-- Submission/observation columns are untouched and remain recordable so the
-- portal can show "processing" and block duplicate payment attempts.
-- Idempotent: create or replace; no row rewrites; trigger binding unchanged.

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

comment on function public.check_payment_gate() is
 'Verified Wise settlement is the sole payment prerequisite for scheduled/in_execution/apostille_processing and later stages (founder decision 2026-11-09). Wise submission observation is display-only.';
