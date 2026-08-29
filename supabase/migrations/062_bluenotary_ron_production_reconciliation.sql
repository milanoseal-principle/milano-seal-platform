begin;

-- 062_bluenotary_ron_production_reconciliation.sql
-- Reconciles the existing RON-01 BlueNotary schema into production without
-- creating a second RON authority. Historical migration 018 remains unchanged.

create table if not exists public.ron_sessions (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  notarization_id text unique not null,
  bn_session_id text unique,
  signing_type text default 'ron',
  session_type text,
  notarization_timing_type text,
  session_timing timestamptz,
  blue_notary_status text default 'DRAFT',
  milano_ron_status text default 'RON_DRAFT',
  identity_status text default 'NOT_STARTED',
  kba_status text default 'NOT_STARTED',
  biometric_status text default 'NOT_STARTED',
  document_tagging_status text default 'PENDING',
  payment_gate_status text default 'LOCKED',
  session_url_status text default 'NOT_RELEASED',
  final_documents_status text default 'NOT_AVAILABLE',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  expired_at timestamptz,
  raw_session jsonb default '{}'::jsonb
);

create table if not exists public.ron_signers (
  id uuid primary key default gen_random_uuid(),
  ron_session_id uuid not null references public.ron_sessions(id) on delete cascade,
  matter_id uuid not null references public.deals(id) on delete restrict,
  signer_index integer,
  first_name text,
  middle_name text,
  last_name text,
  email text,
  phone text,
  state text,
  authentication_type text,
  signing_url_encrypted text,
  signing_url_released boolean default false,
  identity_status text default 'NOT_STARTED',
  kba_status text default 'NOT_STARTED',
  biometric_status text default 'NOT_STARTED',
  joined_at timestamptz,
  left_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ron_documents (
  id uuid primary key default gen_random_uuid(),
  ron_session_id uuid not null references public.ron_sessions(id) on delete cascade,
  matter_id uuid not null references public.deals(id) on delete restrict,
  document_id uuid,
  document_name text,
  document_type text,
  blue_notary_document_name text,
  template_id text,
  smart_tags_applied boolean default false,
  uploaded_to_bluenotary boolean default false,
  signed_document_received boolean default false,
  storage_path text,
  signed_storage_path text,
  document_status text default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (ron_session_id, document_name)
);

create table if not exists public.ron_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_hash text unique not null,
  notarization_id text,
  bn_session_id text,
  event_type text not null,
  event_message text,
  event_by_email text,
  event_by_name text,
  matter_id uuid references public.deals(id) on delete restrict,
  ron_session_id uuid references public.ron_sessions(id) on delete set null,
  processed boolean default false,
  processing_error text,
  raw_payload jsonb default '{}'::jsonb,
  received_at timestamptz default now(),
  processed_at timestamptz
);

create table if not exists public.ron_audit_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.deals(id) on delete restrict,
  ron_session_id uuid references public.ron_sessions(id) on delete set null,
  event_type text not null,
  description text,
  actor_id uuid,
  actor_role text,
  source text default 'milano_seal',
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

create or replace function public.update_ron_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.update_ron_updated_at() from public, anon, authenticated;

 drop trigger if exists ron_sessions_updated_at on public.ron_sessions;
create trigger ron_sessions_updated_at before update on public.ron_sessions
for each row execute function public.update_ron_updated_at();
 drop trigger if exists ron_signers_updated_at on public.ron_signers;
create trigger ron_signers_updated_at before update on public.ron_signers
for each row execute function public.update_ron_updated_at();
 drop trigger if exists ron_documents_updated_at on public.ron_documents;
create trigger ron_documents_updated_at before update on public.ron_documents
for each row execute function public.update_ron_updated_at();

create index if not exists idx_ron_sessions_matter_id on public.ron_sessions(matter_id);
create index if not exists idx_ron_sessions_notarization_id on public.ron_sessions(notarization_id);
create index if not exists idx_ron_sessions_milano_status on public.ron_sessions(milano_ron_status);
create index if not exists idx_ron_signers_session on public.ron_signers(ron_session_id);
create index if not exists idx_ron_signers_email on public.ron_signers(email);
create index if not exists idx_ron_documents_session on public.ron_documents(ron_session_id);
create index if not exists idx_ron_webhook_events_hash on public.ron_webhook_events(event_hash);
create index if not exists idx_ron_webhook_events_notariz on public.ron_webhook_events(notarization_id);
create index if not exists idx_ron_audit_events_matter on public.ron_audit_events(matter_id);
create index if not exists idx_ron_audit_events_session on public.ron_audit_events(ron_session_id);

alter table public.ron_sessions enable row level security;
alter table public.ron_signers enable row level security;
alter table public.ron_documents enable row level security;
alter table public.ron_webhook_events enable row level security;
alter table public.ron_audit_events enable row level security;

-- Remove legacy role policies if migration 018 was ever partially applied.
drop policy if exists "ron_sessions_admin_full" on public.ron_sessions;
drop policy if exists "ron_sessions_finance_read" on public.ron_sessions;
drop policy if exists "ron_sessions_client_read" on public.ron_sessions;
drop policy if exists "ron_sessions_va_read" on public.ron_sessions;
drop policy if exists "ron_signers_admin_full" on public.ron_signers;
drop policy if exists "ron_signers_finance_read" on public.ron_signers;
drop policy if exists "ron_signers_client_read" on public.ron_signers;
drop policy if exists "ron_signers_va_read" on public.ron_signers;
drop policy if exists "ron_documents_admin_full" on public.ron_documents;
drop policy if exists "ron_documents_finance_read" on public.ron_documents;
drop policy if exists "ron_documents_client_read" on public.ron_documents;
drop policy if exists "ron_documents_va_read" on public.ron_documents;
drop policy if exists "ron_webhook_events_admin_full" on public.ron_webhook_events;
drop policy if exists "ron_audit_events_admin_full" on public.ron_audit_events;
drop policy if exists "ron_audit_events_finance_read" on public.ron_audit_events;

create policy ron_sessions_operator_read on public.ron_sessions
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in
  ('founder','founder_admin','admin','admin_operator','ops_manager','finance','finance_operator','execution_coordinator','apostille_coordinator','client_support')
);
create policy ron_sessions_client_read on public.ron_sessions
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
  and exists (select 1 from public.deals d where d.id = matter_id and lower(d.email) = lower(auth.email()))
);

create policy ron_signers_operator_read on public.ron_signers
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in
  ('founder','founder_admin','admin','admin_operator','ops_manager','finance','finance_operator','execution_coordinator','apostille_coordinator','client_support')
);
create policy ron_signers_client_read on public.ron_signers
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
  and lower(email) = lower(auth.email())
  and signing_url_released = true
);

create policy ron_documents_operator_read on public.ron_documents
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in
  ('founder','founder_admin','admin','admin_operator','ops_manager','finance','finance_operator','execution_coordinator','apostille_coordinator','client_support')
);
create policy ron_documents_client_read on public.ron_documents
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
  and signed_document_received = true
  and exists (select 1 from public.deals d where d.id = matter_id and lower(d.email) = lower(auth.email()))
);

create policy ron_webhook_events_operator_read on public.ron_webhook_events
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator')
);
create policy ron_audit_events_operator_read on public.ron_audit_events
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','ops_manager','finance','finance_operator','execution_coordinator','apostille_coordinator')
);

-- Server-side mutations are performed only through service-role backed routes.
create policy ron_sessions_service_all on public.ron_sessions for all to service_role using (true) with check (true);
create policy ron_signers_service_all on public.ron_signers for all to service_role using (true) with check (true);
create policy ron_documents_service_all on public.ron_documents for all to service_role using (true) with check (true);
create policy ron_webhook_events_service_all on public.ron_webhook_events for all to service_role using (true) with check (true);
create policy ron_audit_events_service_all on public.ron_audit_events for all to service_role using (true) with check (true);

revoke all on public.ron_sessions, public.ron_signers, public.ron_documents, public.ron_webhook_events, public.ron_audit_events from anon;
grant select on public.ron_sessions, public.ron_signers, public.ron_documents, public.ron_webhook_events, public.ron_audit_events to authenticated;
grant all on public.ron_sessions, public.ron_signers, public.ron_documents, public.ron_webhook_events, public.ron_audit_events to service_role;

comment on table public.ron_sessions is 'Canonical Milano Seal RON session state linked to one Matter; BlueNotary is the execution provider.';
comment on column public.ron_sessions.payment_gate_status is 'Projection only. Canonical scheduling authority remains deals.payment_confirmed and the payment integrity gate.';

commit;
