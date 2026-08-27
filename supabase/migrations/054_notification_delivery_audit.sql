begin;

-- 054_notification_delivery_audit.sql
-- Adds provider-level delivery evidence fields without converting provider
-- acceptance into proof of final delivery. Human/live certification remains required.

alter table public.notifications
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists delivered_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists last_provider_event_at timestamptz,
  add column if not exists delivery_attempts integer not null default 0;

alter table public.notifications
  drop constraint if exists notifications_delivery_status_check,
  drop constraint if exists notifications_delivery_attempts_check;

alter table public.notifications
  add constraint notifications_delivery_status_check check (
    delivery_status in (
      'pending',
      'provider_accepted',
      'delivered',
      'failed',
      'bounced',
      'complained',
      'suppressed',
      'unknown'
    )
  ),
  add constraint notifications_delivery_attempts_check check (delivery_attempts >= 0);

create index if not exists notifications_provider_message_id_idx
  on public.notifications(provider_message_id)
  where provider_message_id is not null;
create index if not exists notifications_delivery_status_idx
  on public.notifications(delivery_status);
create index if not exists notifications_last_provider_event_at_idx
  on public.notifications(last_provider_event_at desc);

comment on column public.notifications.delivery_status is
  'Provider transport state. provider_accepted is not equivalent to delivered.';
comment on column public.notifications.delivered_at is
  'Set only from authoritative provider delivery evidence; never from application send success alone.';
comment on column public.notifications.last_provider_event_at is
  'Timestamp of the latest authoritative provider delivery event observed.';

commit;
