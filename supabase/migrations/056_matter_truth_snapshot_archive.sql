begin;

-- 056_matter_truth_snapshot_archive.sql
-- Append-only Matter Truth snapshots for deterministic accepted-baseline comparison.
-- This is a governed historical projection. It never replaces canonical Matter fields,
-- Wise settlement, execution truth, authority routing, custody/release or delivery evidence.

create table if not exists public.matter_truth_snapshots (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  status text not null,
  captured_at timestamptz not null default now(),
  accepted_at timestamptz null,
  accepted_by uuid null,
  build_version text not null,
  authority_versions jsonb not null default '{}'::jsonb,
  domains jsonb not null default '{}'::jsonb,
  source_evidence_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint matter_truth_snapshot_status_check check (status in ('ACCEPTED','PENDING_REVIEW','REJECTED')),
  constraint matter_truth_snapshot_acceptance_check check (
    (status = 'ACCEPTED' and accepted_at is not null and accepted_by is not null)
    or
    (status <> 'ACCEPTED')
  )
);

create index if not exists matter_truth_snapshots_matter_idx
  on public.matter_truth_snapshots(matter_id, captured_at desc);

create index if not exists matter_truth_snapshots_accepted_idx
  on public.matter_truth_snapshots(matter_id, accepted_at desc)
  where status = 'ACCEPTED';

alter table public.matter_truth_snapshots enable row level security;

drop policy if exists "matter_truth_snapshots_operator_read" on public.matter_truth_snapshots;
create policy "matter_truth_snapshots_operator_read"
  on public.matter_truth_snapshots
  for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in (
      'founder','founder_admin','admin','admin_operator','ops_manager',
      'finance','finance_operator','execution_coordinator','apostille_coordinator',
      'client_support'
    )
  );

-- Snapshot writes are server-controlled. No authenticated client can insert directly.
drop policy if exists "matter_truth_snapshots_service_insert" on public.matter_truth_snapshots;
create policy "matter_truth_snapshots_service_insert"
  on public.matter_truth_snapshots
  for insert
  to service_role
  with check (true);

drop policy if exists "matter_truth_snapshots_deny_anon" on public.matter_truth_snapshots;
create policy "matter_truth_snapshots_deny_anon"
  on public.matter_truth_snapshots
  for all
  to anon
  using (false)
  with check (false);

create or replace function public.prevent_matter_truth_snapshot_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'matter_truth_snapshots is append-only';
end;
$$;

drop trigger if exists matter_truth_snapshots_no_update on public.matter_truth_snapshots;
create trigger matter_truth_snapshots_no_update
before update on public.matter_truth_snapshots
for each row execute function public.prevent_matter_truth_snapshot_mutation();

drop trigger if exists matter_truth_snapshots_no_delete on public.matter_truth_snapshots;
create trigger matter_truth_snapshots_no_delete
before delete on public.matter_truth_snapshots
for each row execute function public.prevent_matter_truth_snapshot_mutation();

comment on table public.matter_truth_snapshots is
  'Append-only accepted Matter Truth archive for deterministic CHANGED / UNCHANGED / UNKNOWN comparisons. Canonical operational authorities remain external to this projection.';
comment on column public.matter_truth_snapshots.domains is
  'Derived domain snapshot payload. Missing evidence remains missing/unknown and must never be converted to false, zero or success.';
comment on column public.matter_truth_snapshots.authority_versions is
  'Version/provenance metadata only. It does not grant authority to the snapshot projection.';

commit;
