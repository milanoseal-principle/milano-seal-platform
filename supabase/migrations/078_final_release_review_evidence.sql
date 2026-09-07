-- Governed final-release review evidence.
-- Evidence only: this migration creates no second release authority.
-- performFinalRelease(...) remains the single final release mutation path.

create table if not exists public.final_release_review_evidence (
  deal_id uuid primary key references public.deals(id) on delete cascade,
  final_pdf_locked boolean not null default false,
  pathway_reviewed boolean not null default false,
  delivery_recipient_confirmed boolean not null default false,
  founder_approved boolean not null default false,
  compliance_hold boolean not null default true,
  evidence jsonb not null default '{}'::jsonb,
  reviewed_by text null,
  reviewed_role text null,
  review_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.final_release_review_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  actor_id text not null,
  actor_role text not null,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  reason text null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists final_release_review_events_deal_created_idx
  on public.final_release_review_events(deal_id, created_at desc);

alter table public.final_release_review_evidence enable row level security;
alter table public.final_release_review_events enable row level security;

revoke all on public.final_release_review_evidence from anon, authenticated;
revoke all on public.final_release_review_events from anon, authenticated;
grant select, insert, update on public.final_release_review_evidence to service_role;
grant select, insert on public.final_release_review_events to service_role;

comment on table public.final_release_review_evidence is
  'Governed review evidence consumed by the canonical final release authority; never authors release state by itself.';
comment on table public.final_release_review_events is
  'Immutable decision-receipt history for final-release review evidence changes.';
