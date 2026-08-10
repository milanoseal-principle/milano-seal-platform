begin;

-- 049_dashboard_intake_payment_status_reconciliation.sql
-- Repairs the production schema drift that blocks /dashboard/intake Matter saves.
--
-- Verified production drift on 2026-08-10:
--   * runtime writes deals.payment_status = 'unpaid'
--   * production constraint only allowed pending/partial/paid/failed/refunded/disputed
--   * runtime persists deals.discount_amount but production lacked that column
--
-- This migration is additive/idempotent. It accepts canonical `unpaid` for new
-- Matters while preserving existing legacy `pending` rows until the separate
-- canonical-state reconciliation increment audits every downstream consumer.

alter table public.deals
  add column if not exists discount_amount numeric(12,2) default 0;

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

-- Ask PostgREST to refresh the schema cache after the additive column change.
notify pgrst, 'reload schema';

commit;