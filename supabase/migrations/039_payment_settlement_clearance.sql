begin;

-- Payment clearance hardening: distinguish "observed" (payment visible but possibly
-- pending settlement, e.g. card-funded Wise) from "cleared" (funds settled/available).
-- Scheduling/execution may proceed on observed; FINAL RELEASE requires cleared funds
-- OR a recorded founder_admin override. Additive + idempotent; safe to re-run.

alter table public.deals
  add column if not exists payment_settlement_status text not null default 'observed_pending',
  add column if not exists payment_observed_at timestamptz,
  add column if not exists payment_cleared_at timestamptz,
  add column if not exists payment_funding_method text,
  add column if not exists founder_payment_override_at timestamptz,
  add column if not exists founder_payment_override_by text,
  add column if not exists founder_payment_override_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'deals_payment_settlement_status_check'
  ) then
    alter table public.deals
      add constraint deals_payment_settlement_status_check
      check (payment_settlement_status in (
        'unpaid',
        'observed_pending',
        'observed_available',
        'cleared',
        'mismatch_review',
        'failed',
        'refunded'
      ));
  end if;
end $$;

-- Backfill: existing already-confirmed/paid matters are treated as cleared so that
-- in-flight releases are not retroactively blocked by this migration.
update public.deals
set
  payment_settlement_status = 'cleared',
  payment_cleared_at = coalesce(payment_cleared_at, payment_confirmed_at, updated_at, now())
where payment_settlement_status = 'observed_pending'
  and (
    payment_confirmed = true
    or payment_status in ('paid', 'confirmed')
    or deal_status = 'released'
  );

create index if not exists idx_deals_payment_settlement_status
on public.deals (payment_settlement_status);

comment on column public.deals.payment_settlement_status is
'Milano Seal payment clearance state. observed_* = payment visible but may be pending settlement (card-funded Wise can take days) — unlocks scheduling/execution only. cleared = funds settled/available — required for final packet release. A founder_admin override (founder_payment_override_*) may authorize release on non-cleared funds and is always ledgered.';

commit;
