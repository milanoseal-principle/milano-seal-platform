-- Align notification evidence storage with the production transactional email writer.
-- Additive only: no existing notification rows or Matter/payment state is rewritten.

alter table public.notifications
  add column if not exists delivery_status text null;

alter table public.notifications
  add column if not exists delivery_attempts integer not null default 0;

alter table public.notifications
  add column if not exists failed_at timestamptz null;

alter table public.notifications
  add column if not exists last_provider_event_at timestamptz null;
