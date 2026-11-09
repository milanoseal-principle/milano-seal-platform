begin;
-- Reconcile the existing instruction writer with both fresh and hosted schema.
-- Existing financial/history rows and settlement authority are unchanged.
alter table public.payments
 add column if not exists wise_payment_url text,
 add column if not exists wise_session_id text,
 add column if not exists payment_description text;
alter table public.payments drop constraint if exists payments_payment_type_check;
alter table public.payments add constraint payments_payment_type_check check
 (payment_type in ('retainer','balance','full','final_balance','rush_upgrade','translation_addon','additional_apostille','supplemental','refund'));
commit;
