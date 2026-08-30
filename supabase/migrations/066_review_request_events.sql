-- Immutable review workflow events and abuse-control metadata.
-- Review state is operational only and never authorizes Matter execution.

alter table public.review_requests
  add column if not exists ip_hash text,
  add column if not exists request_fingerprint text;

create index if not exists review_requests_session_created_idx
  on public.review_requests (session_reference, created_at desc);
create index if not exists review_requests_ip_created_idx
  on public.review_requests (ip_hash, created_at desc)
  where ip_hash is not null;
create index if not exists review_requests_fingerprint_created_idx
  on public.review_requests (request_fingerprint, created_at desc)
  where request_fingerprint is not null;

create table if not exists public.review_request_events (
  id uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references public.review_requests(id) on delete restrict,
  matter_id uuid null references public.deals(id) on delete set null,
  event_type text not null check (event_type in (
    'REVIEW_REQUESTED', 'REVIEW_ACKNOWLEDGED', 'REVIEW_STARTED', 'REVIEW_RESOLVED', 'REVIEW_CLOSED'
  )),
  from_status text null,
  to_status text not null,
  actor_user_id uuid null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index if not exists review_request_events_request_idx
  on public.review_request_events (review_request_id, created_at asc);

alter table public.review_request_events enable row level security;
revoke all on public.review_request_events from anon, authenticated;
grant select, insert on public.review_request_events to service_role;

create or replace function public.prevent_review_request_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'review_request_events is append-only';
end;
$$;

drop trigger if exists review_request_events_append_only on public.review_request_events;
create trigger review_request_events_append_only
before update or delete on public.review_request_events
for each row execute function public.prevent_review_request_event_mutation();

create or replace function public.capture_review_request_event()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  next_event text;
begin
  if tg_op = 'INSERT' then
    next_event := 'REVIEW_REQUESTED';
    insert into public.review_request_events
      (review_request_id, matter_id, event_type, from_status, to_status, actor_user_id)
    values
      (new.id, new.matter_id, next_event, null, new.status, new.requested_by);
    return new;
  end if;

  if new.status is distinct from old.status then
    next_event := case new.status
      when 'ACKNOWLEDGED' then 'REVIEW_ACKNOWLEDGED'
      when 'IN_PROGRESS' then 'REVIEW_STARTED'
      when 'RESOLVED' then 'REVIEW_RESOLVED'
      when 'CLOSED' then 'REVIEW_CLOSED'
      else null
    end;
    if next_event is not null then
      insert into public.review_request_events
        (review_request_id, matter_id, event_type, from_status, to_status, actor_user_id)
      values
        (new.id, new.matter_id, next_event, old.status, new.status, new.operator_user_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists review_requests_event_capture on public.review_requests;
create trigger review_requests_event_capture
after insert or update of status on public.review_requests
for each row execute function public.capture_review_request_event();
