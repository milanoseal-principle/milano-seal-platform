begin;

-- 055_matter_evidence_ledger.sql
-- Append-only evidence history for critical Milano Seal Matter decisions.
-- This supplements canonical Matter fields; it never replaces them.

create table if not exists public.matter_evidence_ledger (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  event_type text not null,
  domain text not null,
  actor_type text not null,
  actor_id uuid null,
  occurred_at timestamptz not null default now(),
  source text not null,
  source_reference text null,
  evidence_reference text null,
  prior_value jsonb null,
  new_value jsonb null,
  reason text null,
  correlation_id text null,
  provider_event_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint matter_evidence_ledger_domain_check check (
    domain in (
      'pricing','discount','payment','execution','ron','witness','translation',
      'authority','scheduling','apostille_authentication','custody','courier',
      'delivery','release','completion','reconciliation','operator_override'
    )
  )
);

create index if not exists matter_evidence_ledger_matter_idx
  on public.matter_evidence_ledger(matter_id, occurred_at desc);
create index if not exists matter_evidence_ledger_event_idx
  on public.matter_evidence_ledger(event_type, occurred_at desc);
create unique index if not exists matter_evidence_ledger_provider_event_uidx
  on public.matter_evidence_ledger(provider_event_id)
  where provider_event_id is not null;
create index if not exists matter_evidence_ledger_correlation_idx
  on public.matter_evidence_ledger(correlation_id)
  where correlation_id is not null;

alter table public.matter_evidence_ledger enable row level security;

-- Read access is governed only by app_metadata role authority.
drop policy if exists "matter_evidence_ledger_operator_read" on public.matter_evidence_ledger;
create policy "matter_evidence_ledger_operator_read"
  on public.matter_evidence_ledger
  for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in (
      'founder','founder_admin','admin','admin_operator','ops_manager',
      'finance','finance_operator','execution_coordinator','apostille_coordinator',
      'client_support'
    )
  );

-- Canonical server-side writers use service_role. No authenticated client writes.
drop policy if exists "matter_evidence_ledger_service_insert" on public.matter_evidence_ledger;
create policy "matter_evidence_ledger_service_insert"
  on public.matter_evidence_ledger
  for insert
  to service_role
  with check (true);

drop policy if exists "matter_evidence_ledger_deny_anon" on public.matter_evidence_ledger;
create policy "matter_evidence_ledger_deny_anon"
  on public.matter_evidence_ledger
  for all
  to anon
  using (false)
  with check (false);

create or replace function public.prevent_matter_evidence_ledger_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'matter_evidence_ledger is append-only';
end;
$$;

drop trigger if exists matter_evidence_ledger_no_update on public.matter_evidence_ledger;
create trigger matter_evidence_ledger_no_update
before update on public.matter_evidence_ledger
for each row execute function public.prevent_matter_evidence_ledger_mutation();

drop trigger if exists matter_evidence_ledger_no_delete on public.matter_evidence_ledger;
create trigger matter_evidence_ledger_no_delete
before delete on public.matter_evidence_ledger
for each row execute function public.prevent_matter_evidence_ledger_mutation();

comment on table public.matter_evidence_ledger is
  'Append-only evidence history for critical Matter decisions. Canonical Matter fields remain the operational source of truth.';
comment on column public.matter_evidence_ledger.metadata is
  'Safe metadata only. Secrets, raw credentials, KBA answers and sensitive provider tokens are prohibited.';

-- Harden the legacy audit-event read policy so authorization never trusts user_metadata.
drop policy if exists "audit_events_admin_read" on public.audit_events;
create policy "audit_events_admin_read"
  on public.audit_events
  for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in (
      'founder','founder_admin','admin','admin_operator','ops_manager'
    )
  );

commit;
