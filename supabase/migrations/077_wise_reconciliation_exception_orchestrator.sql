-- Automated Wise reconciliation exception orchestration.
--
-- This creates a durable exception lane for observed Wise submissions that do
-- not settle cleanly through the canonical API reconciliation path.
--
-- Authority boundaries:
-- - this table never authors paid state
-- - confirm_wise_payment_for_deal(...) remains the only paid-state authority
-- - scheduling authority remains independent and may already be satisfied by
--   the governed Wise submission
-- - settlement-dependent release remains fail-closed

create table if not exists public.wise_reconciliation_exceptions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references public.deals(id) on delete cascade,
  matter_reference text not null,
  status text not null default 'open'
    check (status in ('open','resolved')),
  reason text not null
    check (reason in (
      'provider_correlation_missing',
      'settlement_pending_with_provider_evidence',
      'payment_mismatch_review'
    )),
  severity text not null
    check (severity in ('watch','action_required')),
  scheduling_authorized boolean not null default false,
  payment_observed_at timestamptz not null,
  provider_resource_id text null,
  amount_due numeric(12,2) not null check (amount_due >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  next_action text not null,
  resolution text null,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wise_reconciliation_exceptions_status_idx
  on public.wise_reconciliation_exceptions(status, severity, last_detected_at desc);
create index if not exists wise_reconciliation_exceptions_reference_idx
  on public.wise_reconciliation_exceptions(matter_reference);

alter table public.wise_reconciliation_exceptions enable row level security;
revoke all on public.wise_reconciliation_exceptions from anon, authenticated;
grant select, insert, update on public.wise_reconciliation_exceptions to service_role;
