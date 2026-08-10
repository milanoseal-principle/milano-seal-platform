-- 050_live_intake_execution_truth_reconciliation.sql
-- Live repair for /dashboard/intake persistence plus canonical execution truth.
-- Additive/idempotent. Legacy `pending` remains accepted for historical rows.

begin;

alter table public.deals
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists execution_truth jsonb;

alter table public.deals
  drop constraint if exists deals_payment_status_check;

alter table public.deals
  alter column payment_status set default 'unpaid';

alter table public.deals
  add constraint deals_payment_status_check
  check (payment_status in (
    'unpaid',
    'pending',
    'partial',
    'paid',
    'failed',
    'refunded',
    'disputed'
  ));

alter table public.deals
  drop constraint if exists deals_execution_truth_object_check;

alter table public.deals
  add constraint deals_execution_truth_object_check
  check (execution_truth is null or jsonb_typeof(execution_truth) = 'object');

comment on column public.deals.execution_truth is
  'Canonical Matter execution truth. Legacy mobile/apostille fields are compatibility projections only.';

notify pgrst, 'reload schema';

commit;
