-- P0: observation/submission and courtesy authorization are not settlement.
-- Replace 079's authority expansion without altering historical migrations.
begin;

create or replace function public.check_payment_gate()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  protected_states text[] := array[
    'payment_confirmed', 'scheduled', 'in_execution', 'apostille_processing',
    'in_transit', 'delivered', 'completed', 'apostille', 'shipped', 'complete'
  ];
  settlement_verified boolean;
begin
  settlement_verified := NEW.payment_confirmed is true
    and NEW.payment_status = 'paid'
    and NEW.payment_settlement_status = 'cleared'
    and NEW.amount_due > 0 and NEW.amount_paid > 0
    and NEW.amount_due::text not in ('NaN', 'Infinity', '-Infinity')
    and NEW.amount_paid::text not in ('NaN', 'Infinity', '-Infinity')
    and round(NEW.amount_paid * 100) = round(NEW.amount_due * 100);

  -- The canonical confirmation RPC holds the Matter row lock. Advance only
  -- the awaiting-payment lifecycle; replays never regress a progressed Matter.
  if TG_OP = 'UPDATE' and settlement_verified
     and NEW.status = 'awaiting_payment' then
    NEW.status := 'payment_confirmed';
    NEW.deal_status := 'payment_confirmed';
  end if;

  -- A refund/failure must still be recordable on an already progressed Matter.
  -- It revokes eligibility through the shared gate; the next lifecycle change
  -- is blocked. Never reject financial truth solely to preserve a stale stage.
  if TG_OP = 'UPDATE' then
    if NEW.status is not distinct from OLD.status
       and NEW.deal_status is not distinct from OLD.deal_status then
      return NEW;
    end if;
  end if;

  -- Check both lifecycle columns, including transitions within the protected
  -- corridor. Observation and complimentary flags never satisfy this guard.
  if NEW.status = any(protected_states)
     or NEW.deal_status = any(protected_states) then
    if settlement_verified then
      if TG_OP = 'UPDATE' and NEW.status = 'scheduled'
         and OLD.status not in ('payment_confirmed', 'scheduled') then
        raise exception 'INVALID_STATE_TRANSITION: scheduling requires payment_confirmed';
      end if;
      return NEW;
    end if;
    raise exception 'PAYMENT_REQUIRED: verified Wise settlement required before protected Matter progression';
  end if;
  return NEW;
end;
$$;

drop trigger if exists enforce_payment_gate_on_status_insert on public.deals;
create trigger enforce_payment_gate_on_status_insert
  before insert on public.deals
  for each row execute function public.check_payment_gate();

drop trigger if exists enforce_payment_gate_on_status_update on public.deals;
create trigger enforce_payment_gate_on_status_update
  before update of status, deal_status, payment_confirmed, payment_status,
    payment_settlement_status, amount_due, amount_paid on public.deals
  for each row execute function public.check_payment_gate();

-- Existing, already verified awaiting-payment rows need the same lifecycle
-- projection as a fresh confirmation. This changes no financial authority.
update public.deals
set status = 'payment_confirmed', deal_status = 'payment_confirmed'
where status = 'awaiting_payment'
  and payment_confirmed is true
  and payment_status = 'paid'
  and payment_settlement_status = 'cleared'
  and amount_due > 0 and amount_paid > 0
  and amount_due::text not in ('NaN', 'Infinity', '-Infinity')
  and amount_paid::text not in ('NaN', 'Infinity', '-Infinity')
  and round(amount_paid * 100) = round(amount_due * 100);

commit;
