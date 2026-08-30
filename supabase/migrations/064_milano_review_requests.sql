-- Governed human review workflow. This is not a chat system and does not create Matter truth.
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid null references public.deals(id) on delete set null,
  requester_user_id uuid null references auth.users(id) on delete set null,
  session_reference text null,
  country text null,
  document_type text null,
  origin text null,
  signer_posture text null,
  question text not null check (char_length(question) between 1 and 4000),
  safe_context jsonb not null default '{}'::jsonb,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','ACKNOWLEDGED','IN_REVIEW','RESOLVED','CLOSED')),
  assigned_operator_id uuid null references auth.users(id) on delete set null,
  operator_response text null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz null,
  resolved_at timestamptz null,
  updated_at timestamptz not null default now()
);

create index if not exists review_requests_status_created_idx on public.review_requests(status, created_at desc);
create index if not exists review_requests_matter_idx on public.review_requests(matter_id, created_at desc);
create index if not exists review_requests_requester_idx on public.review_requests(requester_user_id, created_at desc);

alter table public.review_requests enable row level security;

-- Application access is deliberately service-route mediated. Service role bypasses RLS;
-- clients/operators do not receive direct table mutation authority.
revoke all on public.review_requests from anon, authenticated;

grant select, insert, update on public.review_requests to service_role;

comment on table public.review_requests is 'Governed Milano Execution Desk human review requests. Status language is evidence-backed only; never represents fake operator presence.';
