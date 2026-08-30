alter table public.review_requests
  add column if not exists request_ip_hash text,
  add column if not exists request_fingerprint text;

create index if not exists review_requests_session_created_idx
  on public.review_requests (session_reference, created_at desc);
create index if not exists review_requests_ip_created_idx
  on public.review_requests (request_ip_hash, created_at desc);
create index if not exists review_requests_fingerprint_created_idx
  on public.review_requests (request_fingerprint, created_at desc);

create table if not exists public.review_request_events (
  id uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references public.review_requests(id) on delete cascade,
  matter_id uuid null references public.deals(id) on delete set null,
  event_type text not null check (event_type in ('REVIEW_REQUESTED','REVIEW_ACKNOWLEDGED','REVIEW_STARTED','REVIEW_RESOLVED','REVIEW_CLOSED','REVIEW_MATTER_LINKED')),
  from_status text null,
  to_status text null,
  actor_user_id uuid null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists review_request_events_review_idx on public.review_request_events(review_request_id, created_at);
create index if not exists review_request_events_matter_idx on public.review_request_events(matter_id, created_at);

alter table public.review_request_events enable row level security;
revoke all on public.review_request_events from anon, authenticated;
grant all on public.review_request_events to service_role;

create or replace function public.block_review_request_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'review_request_events is append-only';
end;
$$;

revoke all on function public.block_review_request_event_mutation() from public, anon, authenticated;
grant execute on function public.block_review_request_event_mutation() to service_role;

drop trigger if exists review_request_events_no_update on public.review_request_events;
create trigger review_request_events_no_update before update or delete on public.review_request_events
for each row execute function public.block_review_request_event_mutation();
