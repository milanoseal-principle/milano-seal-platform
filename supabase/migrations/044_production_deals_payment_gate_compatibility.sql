-- 044 — Production deals payment-gate compatibility.
--
-- Captures the VERIFIED PRODUCTION behavior so a fresh environment reproduces it.
-- Production uses `deals.status` as the operational Matter lifecycle field (NOT
-- `deal_status`, which is legacy-only, and NOT `stage`, which is the sales
-- pipeline). This migration is ADDITIVE and IDEMPOTENT: it adds a nullable
-- `currency` column if missing and replaces the payment-gate function+triggers to
-- evaluate `NEW.status`. It rewrites no rows and changes no RLS.
--
-- Does NOT modify migration 043. Does NOT reference the deals amount-due column.
--
-- Rollback guidance (manual, if ever needed):
--   * To revert to the 043 behavior, re-run migration 043's check_payment_gate()
--     definition and its triggers (deal_status-based). `currency` may remain; it
--     is nullable and unused by paid/complimentary gating.
--   * No data restore is required — this migration writes no rows.

-- 1. Additive column (nullable; no default backfill of existing rows).
alter table public.deals
  add column if not exists currency text null;

-- 2. Payment gate evaluated on the canonical operational status field (status).
create or replace function public.check_payment_gate()
returns trigger as $$
declare
  protected_states text[] := array[
    'scheduled', 'in_execution', 'apostille', 'apostille_processing',
    'shipped', 'in_transit', 'delivered', 'completed'
  ];
begin
  -- Only gate a transition INTO a protected operational state (status), and only
  -- when the prior status was not already protected. `stage` is never consulted.
  if NEW.status = any(protected_states)
     and coalesce(OLD.status, '') <> all(protected_states) then

    -- Normal paid advancement.
    if NEW.payment_confirmed = true
       or NEW.payment_status = 'paid' then
      return NEW;
    end if;

    -- Complimentary advancement — only with a fully-authorized zero-revenue disposition.
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

    raise exception 'PAYMENT_REQUIRED: matter cannot advance to % — verified payment or active complimentary authorization required', NEW.status;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- 3. Recreate triggers bound to `status`.
drop trigger if exists enforce_payment_gate_on_status_insert on public.deals;
create trigger enforce_payment_gate_on_status_insert
  before insert on public.deals
  for each row execute function public.check_payment_gate();

drop trigger if exists enforce_payment_gate_on_status_update on public.deals;
create trigger enforce_payment_gate_on_status_update
  before update of status on public.deals
  for each row execute function public.check_payment_gate();
