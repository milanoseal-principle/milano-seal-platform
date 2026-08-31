begin;

-- 073_payment_observation_snapshot.sql
-- Immutable snapshot of the payable scope captured at the moment a governed Wise
-- submission is observed. The canonical scheduling authority uses these columns
-- to fail closed if the amount, currency or Wise correlation reference is mutated
-- after submission, requiring fresh payment evidence before scheduling.
--
-- Additive + idempotent. These columns NEVER author paid/settled state; they only
-- describe what the client submitted against. Legacy observations recorded before
-- this migration leave the columns null and are trusted as-is (never retroactively
-- failed closed).

alter table public.deals
  add column if not exists payment_observed_amount numeric(12, 2),
  add column if not exists payment_observed_currency text,
  add column if not exists payment_observed_reference text;

comment on column public.deals.payment_observed_amount is
'Snapshot of amount_due at governed Wise submission time. Used by the scheduling authority to fail closed on post-submission price mutation. Not a settlement amount.';

comment on column public.deals.payment_observed_currency is
'Snapshot of currency at governed Wise submission time. Used to fail closed on post-submission currency mutation.';

comment on column public.deals.payment_observed_reference is
'Snapshot of the Wise correlation reference (Matter reference) at governed submission time. Used to fail closed if the correlation key is changed after submission.';

commit;
