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

-- 032 creates the first identifier_locks projection using
-- matter_id/identifier_type/source_value/final_value/match_status/locked_by.
-- CREATE TABLE IF NOT EXISTS above therefore does not add the 037/038 fields on
-- a fresh replay. Reconcile those columns before any trigger or index uses them.
alter table public.identifier_locks
  add column if not exists field_id text,
  add column if not exists locked_value text,
  add column if not exists confirmed_by text,
  add column if not exists approval_cycle integer not null default 1,
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

-- Preserve 032 values while projecting them into the governed 038 lock model.
-- A migration marker is used only where the old record had no actor; it does
-- not assert a real operator identity.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'identifier_locks' and column_name = 'identifier_type'
  ) then
    execute $sql$
      update public.identifier_locks
      set field_id = coalesce(field_id, identifier_type),
          locked_value = coalesce(locked_value, final_value, source_value),
          confirmed_by = coalesce(nullif(trim(confirmed_by), ''), nullif(trim(locked_by), ''), 'legacy-migration-record'),
          status = case
            when lower(coalesce(match_status, '')) = 'mismatch' then 'mismatch'
            when lower(coalesce(match_status, '')) in ('matched','exact_match','confirmed') then 'confirmed'
            when locked_at is not null then 'locked'
            else coalesce(status, 'needs_review')
          end,
          mismatch_reason = coalesce(mismatch_reason, case when lower(coalesce(match_status, '')) = 'mismatch' then mismatch_reason else null end),
          locked_at = coalesce(locked_at, created_at, now())
    $sql$;
  end if;
end $$;

update public.identifier_locks
set field_id = coalesce(nullif(trim(field_id), ''), 'legacy_identifier'),
    locked_value = coalesce(nullif(trim(locked_value), ''), 'REVIEW_REQUIRED'),
    confirmed_by = coalesce(nullif(trim(confirmed_by), ''), 'legacy-migration-record'),
    locked_at = coalesce(locked_at, created_at, now())
where field_id is null or trim(field_id) = ''
   or locked_value is null or trim(locked_value) = ''
   or confirmed_by is null or trim(confirmed_by) = ''
   or locked_at is null;

alter table public.identifier_locks
  alter column field_id set not null,
  alter column locked_value set not null,
  alter column confirmed_by set not null,
  alter column locked_at set not null;

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

create index if not exists idx_document_approval_events_matter_id
on public.document_approval_events (matter_id);

create index if not exists idx_document_approval_events_document_version_id
on public.document_approval_events (document_version_id);

create index if not exists idx_document_approval_events_event_type
on public.document_approval_events (event_type);

commit;
