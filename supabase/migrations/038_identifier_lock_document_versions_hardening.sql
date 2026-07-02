begin;

create extension if not exists pgcrypto;

create or replace function public.ms_normalize_locked_value(p_value text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      upper(trim(coalesce(p_value, ''))),
      '\s+',
      '',
      'g'
    ),
    ''
  );
$$;

create or replace function public.ms_sha256_text(p_value text)
returns text
language sql
immutable
as $$
  select encode(digest(coalesce(p_value, ''), 'sha256'), 'hex');
$$;

create table if not exists public.identifier_locks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  field_id text not null,
  locked_value text not null,
  confirmed_by text not null,
  locked_at timestamptz not null default now(),
  approval_cycle integer not null default 1
);

alter table public.identifier_locks
  add column if not exists field_label text,
  add column if not exists field_category text not null default 'identity_critical',
  add column if not exists normalized_value text,
  add column if not exists value_hash text,
  add column if not exists lock_scope text not null default 'matter',
  add column if not exists status text not null default 'locked',
  add column if not exists required_for_states text[] not null default array[
    'scheduling_unlocked',
    'ron_completed',
    'apostille_packet_ready',
    'ready_for_release'
  ]::text[],
  add column if not exists client_confirmed_by text,
  add column if not exists client_confirmed_at timestamptz,
  add column if not exists attorney_confirmed_by text,
  add column if not exists attorney_confirmed_at timestamptz,
  add column if not exists operator_confirmed_by text,
  add column if not exists operator_confirmed_at timestamptz,
  add column if not exists mismatch_reason text,
  add column if not exists superseded_by uuid,
  add column if not exists superseded_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'identifier_locks_status_check'
  ) then
    alter table public.identifier_locks
      add constraint identifier_locks_status_check
      check (status in (
        'draft',
        'locked',
        'client_confirmed',
        'attorney_confirmed',
        'operator_confirmed',
        'confirmed',
        'needs_review',
        'mismatch',
        'superseded'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'identifier_locks_field_category_check'
  ) then
    alter table public.identifier_locks
      add constraint identifier_locks_field_category_check
      check (field_category in (
        'identity_critical',
        'tax_identifier',
        'passport_identifier',
        'property_identifier',
        'company_identifier',
        'asset_identifier',
        'document_identifier',
        'other'
      ));
  end if;
end $$;

create or replace function public.ms_identifier_lock_before_write()
returns trigger
language plpgsql
as $$
begin
  new.normalized_value := public.ms_normalize_locked_value(new.locked_value);
  new.value_hash := public.ms_sha256_text(new.normalized_value);
  new.updated_at := now();

  if new.confirmed_by is null or length(trim(new.confirmed_by)) = 0 then
    raise exception 'identifier_locks.confirmed_by is required';
  end if;

  if new.locked_value is null or length(trim(new.locked_value)) = 0 then
    raise exception 'identifier_locks.locked_value is required';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_identifier_locks_before_write on public.identifier_locks;

create trigger trg_identifier_locks_before_write
before insert or update on public.identifier_locks
for each row
execute function public.ms_identifier_lock_before_write();

create unique index if not exists idx_identifier_locks_active_unique
on public.identifier_locks (matter_id, field_id)
where status <> 'superseded';

create index if not exists idx_identifier_locks_matter_id
on public.identifier_locks (matter_id);

create index if not exists idx_identifier_locks_status
on public.identifier_locks (status);

create index if not exists idx_identifier_locks_value_hash
on public.identifier_locks (value_hash);

create table if not exists public.identifier_confirmation_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  identifier_lock_id uuid references public.identifier_locks(id) on delete cascade,
  field_id text not null,
  event_type text not null,
  confirmation_status text not null,
  confirmed_value text,
  normalized_value text,
  confirmed_by text not null,
  confirmed_by_role text not null,
  confirmation_source text not null default 'operator',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'identifier_confirmation_events_type_check'
  ) then
    alter table public.identifier_confirmation_events
      add constraint identifier_confirmation_events_type_check
      check (event_type in (
        'IDENTIFIER_FIELDS_CAPTURED',
        'IDENTIFIER_CLIENT_CONFIRMED',
        'IDENTIFIER_ATTORNEY_CONFIRMED',
        'IDENTIFIER_OPERATOR_CONFIRMED',
        'IDENTIFIER_COMPARE_PASSED',
        'IDENTIFIER_COMPARE_FAILED',
        'IDENTIFIER_MISMATCH_FLAGGED',
        'IDENTIFIER_LOCKED',
        'MATTER_PAUSED_FOR_CORRECTION',
        'IDENTIFIER_SUPERSEDED'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'identifier_confirmation_events_status_check'
  ) then
    alter table public.identifier_confirmation_events
      add constraint identifier_confirmation_events_status_check
      check (confirmation_status in (
        'captured',
        'confirmed',
        'exact_match',
        'mismatch',
        'needs_review',
        'superseded'
      ));
  end if;
end $$;

create index if not exists idx_identifier_confirmation_events_matter_id
on public.identifier_confirmation_events (matter_id);

create index if not exists idx_identifier_confirmation_events_lock_id
on public.identifier_confirmation_events (identifier_lock_id);

create index if not exists idx_identifier_confirmation_events_event_type
on public.identifier_confirmation_events (event_type);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  stage text not null,
  file_hash text not null,
  actor text not null,
  source_file text not null,
  notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.document_versions
  add column if not exists version_number integer not null default 1,
  add column if not exists document_type text,
  add column if not exists source_stage text,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists approval_status text not null default 'pending_review',
  add column if not exists approved_by text,
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists identifier_compare_status text not null default 'not_run',
  add column if not exists identifier_compare_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'document_versions_stage_check'
  ) then
    alter table public.document_versions
      add constraint document_versions_stage_check
      check (stage in (
        'intake_upload',
        'draft',
        'client_approved',
        'ron_ready',
        'executed',
        'scan_back',
        'apostille_packet',
        'apostilled',
        'final_packet',
        'released',
        'archived'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'document_versions_approval_status_check'
  ) then
    alter table public.document_versions
      add constraint document_versions_approval_status_check
      check (approval_status in (
        'pending_review',
        'approved',
        'rejected',
        'superseded',
        'release_ready'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'document_versions_identifier_compare_status_check'
  ) then
    alter table public.document_versions
      add constraint document_versions_identifier_compare_status_check
      check (identifier_compare_status in (
        'not_run',
        'passed',
        'failed',
        'needs_review'
      ));
  end if;
end $$;

create index if not exists idx_document_versions_matter_id
on public.document_versions (matter_id);

create index if not exists idx_document_versions_stage
on public.document_versions (stage);

create index if not exists idx_document_versions_file_hash
on public.document_versions (file_hash);

create index if not exists idx_document_versions_approval_status
on public.document_versions (approval_status);

create table if not exists public.document_identifier_checks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  identifier_lock_id uuid references public.identifier_locks(id) on delete set null,
  field_id text not null,
  locked_value text not null,
  extracted_value text,
  normalized_locked_value text,
  normalized_extracted_value text,
  compare_status text not null,
  checked_by text not null default 'system',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'document_identifier_checks_status_check'
  ) then
    alter table public.document_identifier_checks
      add constraint document_identifier_checks_status_check
      check (compare_status in (
        'exact_match',
        'mismatch',
        'missing_from_document',
        'missing_lock',
        'needs_review'
      ));
  end if;
end $$;

create index if not exists idx_document_identifier_checks_matter_id
on public.document_identifier_checks (matter_id);

create index if not exists idx_document_identifier_checks_document_version_id
on public.document_identifier_checks (document_version_id);

create index if not exists idx_document_identifier_checks_compare_status
on public.document_identifier_checks (compare_status);

create table if not exists public.document_approval_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  event_type text not null,
  approval_status text not null,
  actor text not null,
  actor_role text not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'document_approval_events_type_check'
  ) then
    alter table public.document_approval_events
      add constraint document_approval_events_type_check
      check (event_type in (
        'DOCUMENT_VERSION_CREATED',
        'DOCUMENT_IDENTIFIER_COMPARE_RUN',
        'DOCUMENT_IDENTIFIER_COMPARE_PASSED',
        'DOCUMENT_IDENTIFIER_COMPARE_FAILED',
        'DOCUMENT_CLIENT_APPROVED',
        'DOCUMENT_OPERATOR_APPROVED',
        'DOCUMENT_REJECTED',
        'DOCUMENT_SUPERSEDED',
        'DOCUMENT_RELEASE_READY'
      ));
  end if;
end $$;

create index if not exists idx_document_approval_events_matter_id
on public.document_approval_events (matter_id);

create index if not exists idx_document_approval_events_document_version_id
on public.document_approval_events (document_version_id);

create table if not exists public.document_integrity_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  document_version_id uuid references public.document_versions(id) on delete set null,
  event_type text not null,
  severity text not null default 'info',
  actor text not null default 'system',
  message text not null,
  blocked_gate text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'document_integrity_events_severity_check'
  ) then
    alter table public.document_integrity_events
      add constraint document_integrity_events_severity_check
      check (severity in ('info', 'warning', 'blocker', 'critical'));
  end if;
end $$;

create index if not exists idx_document_integrity_events_matter_id
on public.document_integrity_events (matter_id);

create index if not exists idx_document_integrity_events_event_type
on public.document_integrity_events (event_type);

create index if not exists idx_document_integrity_events_severity
on public.document_integrity_events (severity);

create or replace function public.ms_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_document_versions_touch_updated_at on public.document_versions;

create trigger trg_document_versions_touch_updated_at
before update on public.document_versions
for each row
execute function public.ms_touch_updated_at();

create or replace view public.matter_identifier_lock_status as
select
  il.matter_id,
  count(*)::integer as total_locked_identifiers,
  count(*) filter (
    where il.status in ('confirmed', 'client_confirmed', 'attorney_confirmed', 'operator_confirmed', 'locked')
  )::integer as confirmed_or_locked_count,
  count(*) filter (
    where il.status in ('mismatch', 'needs_review')
  )::integer as blocker_count,
  bool_and(il.status not in ('mismatch', 'needs_review')) as identifiers_ready,
  jsonb_agg(
    jsonb_build_object(
      'field_id', il.field_id,
      'field_label', il.field_label,
      'field_category', il.field_category,
      'status', il.status,
      'locked_at', il.locked_at,
      'approval_cycle', il.approval_cycle
    )
    order by il.field_id
  ) as identifiers
from public.identifier_locks il
where il.status <> 'superseded'
group by il.matter_id;

create or replace function public.ms_assert_matter_identifiers_ready(p_matter_id uuid)
returns table (
  ready boolean,
  blocker_count integer,
  blockers jsonb
)
language sql
stable
as $$
  with blocker_rows as (
    select
      field_id,
      field_label,
      field_category,
      status,
      mismatch_reason
    from public.identifier_locks
    where matter_id = p_matter_id
      and status in ('mismatch', 'needs_review')
      and status <> 'superseded'
  )
  select
    not exists (select 1 from blocker_rows) as ready,
    (select count(*)::integer from blocker_rows) as blocker_count,
    coalesce(
      (
        select jsonb_agg(to_jsonb(blocker_rows))
        from blocker_rows
      ),
      '[]'::jsonb
    ) as blockers;
$$;

alter table public.identifier_locks enable row level security;
alter table public.identifier_confirmation_events enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_identifier_checks enable row level security;
alter table public.document_approval_events enable row level security;
alter table public.document_integrity_events enable row level security;

comment on table public.identifier_locks is
'Milano Seal identifier lock table. Identity-critical values such as Codice Fiscale, passport, tax ID, property ID, company number, asset serial, and similar identifiers must not be mutated by AI, translation, formatting, RON prep, apostille packet prep, or final packet assembly.';

comment on table public.document_versions is
'Milano Seal document version ledger. Tracks each version across intake, draft, client approval, RON, execution, apostille, final packet, and release.';

comment on table public.document_identifier_checks is
'Compares locked identifiers against each document version. Mismatches must block RON, apostille, and release gates until corrected.';

comment on function public.ms_assert_matter_identifiers_ready(uuid) is
'Returns whether a matter has identifier blockers that must stop RON, apostille, or final release.';

commit;
