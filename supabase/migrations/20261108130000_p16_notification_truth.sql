-- P16: notification truth. Extends public.notifications (single delivery-evidence system).
-- provider_accepted is never delivered; delivered/bounced/suppressed require provider evidence.
begin;

alter table public.notifications
  add column if not exists idempotency_key text,
  add column if not exists correlation_id text,
  add column if not exists template_id text,
  add column if not exists template_version text,
  add column if not exists queued_at timestamptz,
  add column if not exists attempted_at timestamptz,
  add column if not exists provider_accepted_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists suppressed_at timestamptz,
  add column if not exists error_classification text,
  add column if not exists provider_event_id text,
  add column if not exists delivery_evidence_ref text;

create unique index if not exists notifications_idempotency_key_uidx
  on public.notifications(idempotency_key) where idempotency_key is not null;
create unique index if not exists notifications_provider_event_uidx
  on public.notifications(provider_event_id) where provider_event_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'notifications_terminal_evidence_check') then
    alter table public.notifications add constraint notifications_terminal_evidence_check check (
      (delivery_status <> 'delivered' or (delivered_at is not null and nullif(btrim(delivery_evidence_ref), '') is not null))
      and (delivery_status <> 'bounced' or (bounced_at is not null and nullif(btrim(delivery_evidence_ref), '') is not null))
      and (delivery_status <> 'suppressed' or suppressed_at is not null)
    ) not valid;
  end if;
end $$;

-- Delivery truth only moves forward; a later provider_accepted cannot erase delivered/bounced evidence.
create or replace function public.enforce_notification_truth()
returns trigger language plpgsql set search_path = '' as $$
begin
  if OLD.delivery_status in ('delivered','bounced','complained','suppressed')
     and NEW.delivery_status is distinct from OLD.delivery_status then
    raise exception using errcode = '23514', message = 'NOTIFICATION_TERMINAL_STATE_IMMUTABLE';
  end if;
  if NEW.delivered_at is distinct from OLD.delivered_at and OLD.delivered_at is not null then
    raise exception using errcode = '23514', message = 'NOTIFICATION_DELIVERY_EVIDENCE_IMMUTABLE';
  end if;
  return NEW;
end;
$$;
revoke all on function public.enforce_notification_truth() from public, anon, authenticated;
drop trigger if exists enforce_notification_truth on public.notifications;
create trigger enforce_notification_truth before update on public.notifications
  for each row execute function public.enforce_notification_truth();

comment on column public.notifications.delivery_evidence_ref is
  'Provider webhook event id proving delivered/bounced state. Required for those states.';

commit;
