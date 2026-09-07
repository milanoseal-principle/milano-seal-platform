-- 079 — Align the database Matter gate with canonical Wise authority layers.
--
-- Scheduling authority:
--   * verified Wise payment, OR
--   * integrity-matched observed Wise submission while settlement is pending, OR
--   * active complimentary authorization.
--
-- Execution authority after scheduling:
--   * verified Wise payment, OR
--   * the same integrity-matched observation PLUS server-side Wise provider evidence, OR
--   * active complimentary authorization.
--
-- Neither observed submission nor provider processing evidence marks the Matter paid,
-- settles funds, or satisfies final-release authority. Final release remains governed by
-- its separate settlement/release controls.

create or replace function public.check_payment_gate()
returns trigger as $$
declare
  protected_states text[] := array[
    'scheduled', 'in_execution', 'apostille_processing',
    'in_transit', 'delivered', 'completed'
  ];
  previous_status text := '';
  observed_submission_valid boolean := false;
  provider_payment_valid boolean := false;
begin
  if TG_OP = 'UPDATE' then
    previous_status := coalesce(OLD.status, '');
  end if;

  if NEW.status = any(protected_states)
     and previous_status <> all(protected_states) then

    -- Verified Wise payment remains full lifecycle payment authority.
    if NEW.payment_confirmed = true
       or NEW.payment_status = 'paid' then
      return NEW;
    end if;

    -- Bind the observed submission to the active quote amount/currency/reference so
    -- stale observations cannot authorize a changed Matter.
    if NEW.payment_observed_at is not null
       and lower(coalesce(NEW.payment_settlement_status, '')) = 'observed_pending' then
      observed_submission_valid :=
        (NEW.payment_observed_amount is null
          or NEW.payment_observed_amount = coalesce(NEW.amount_due, 0))
        and (nullif(btrim(coalesce(NEW.payment_observed_currency, '')), '') is null
          or upper(NEW.payment_observed_currency) = upper(coalesce(NEW.currency, 'USD')))
        and (nullif(btrim(coalesce(NEW.payment_observed_reference, '')), '') is null
          or NEW.payment_observed_reference = coalesce(nullif(btrim(NEW.wise_reference), ''), NEW.deal_id));
    end if;

    -- Client-side observed Wise submission authorizes scheduling only.
    if NEW.status = 'scheduled' and observed_submission_valid then
      return NEW;
    end if;

    -- Later execution progression requires provider-side Wise evidence in addition
    -- to the integrity-matched observation. This remains non-paid/non-settled truth.
    provider_payment_valid :=
      observed_submission_valid
      and nullif(btrim(coalesce(NEW.wise_transaction_reference, '')), '') is not null
      and NEW.payment_funding_method = 'wise_acquiring_payment';

    if NEW.status <> 'scheduled' and provider_payment_valid then
      return NEW;
    end if;

    -- Complimentary advancement remains governed and zero-revenue only.
    if NEW.payment_disposition = 'complimentary'
       and NEW.comp_authorized = true
       and NEW.comp_authorization_id is not null
       and NEW.comp_authorized_at is not null
       and NEW.comp_revoked_at is null
       and NEW.payment_confirmed = false
       and coalesce(NEW.amount_paid, 0) = 0
       and coalesce(NEW.verified_revenue, 0) = 0
       and exists (
         select 1 from public.complimentary_authorizations ca
         where ca.id = NEW.comp_authorization_id
           and ca.matter_id = NEW.id
           and ca.status = 'active'
           and ca.final_amount_due = 0
           and ca.discount_amount = ca.original_total
       ) then
      return NEW;
    end if;

    raise exception 'PAYMENT_REQUIRED: matter cannot advance to % — verified payment, valid Wise authority, or active complimentary authorization required', NEW.status;
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Rebind explicitly so fresh and upgraded databases use the same function.
drop trigger if exists enforce_payment_gate_on_status_insert on public.deals;
create trigger enforce_payment_gate_on_status_insert
  before insert on public.deals
  for each row execute function public.check_payment_gate();

drop trigger if exists enforce_payment_gate_on_status_update on public.deals;
create trigger enforce_payment_gate_on_status_update
  before update of status on public.deals
  for each row execute function public.check_payment_gate();
