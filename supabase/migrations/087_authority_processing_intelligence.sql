begin;

-- 087_authority_processing_intelligence.sql
-- Source-backed authority processing observations and the official-source
-- monitor's change-review queue. Additive. No processing time is seeded or
-- hardcoded: every observation is recorded with provenance and expires.
-- A detected source change NEVER rewrites canonical authority records; it
-- creates an authority_review_required row that an operator must decide.

create table if not exists public.authority_processing_observations (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.state_authorities(id) on delete restrict,
  service_type text not null,
  source_url text,
  source_title text,
  source_date date,
  observed_processing_date date,
  estimated_days integer,
  observation_method text not null,
  confidence text not null,
  observed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  operator_override boolean not null default false,
  override_reason text,
  verified_by uuid,
  created_at timestamptz not null default now(),
  constraint authority_processing_observations_service_type_check check (
    service_type in ('apostille', 'notarial_certificate', 'authentication', 'other')
  ),
  constraint authority_processing_observations_method_check check (
    observation_method in ('official_source', 'operator_confirmed', 'observed_turnaround', 'other')
  ),
  constraint authority_processing_observations_confidence_check check (
    confidence in ('VERIFIED_SOURCE', 'OPERATOR_CONFIRMED', 'OBSERVED', 'LOW_CONFIDENCE')
  ),
  constraint authority_processing_observations_days_check check (
    estimated_days is null or (estimated_days >= 0 and estimated_days <= 365)
  ),
  -- Observations must expire, and within a bounded review window.
  constraint authority_processing_observations_expiry_check check (
    expires_at > observed_at and expires_at <= observed_at + interval '120 days'
  ),
  -- Only an official government source may be VERIFIED_SOURCE.
  constraint authority_processing_observations_verified_source_check check (
    confidence <> 'VERIFIED_SOURCE' or (
      source_url is not null
      and lower(source_url) ~ '^https://([a-z0-9-]+\.)*([a-z0-9-]+\.gov|state\.[a-z]{2}\.us)(/.*)?$'
      and source_date is not null
      and verified_by is not null
    )
  ),
  constraint authority_processing_observations_operator_confirmed_check check (
    confidence <> 'OPERATOR_CONFIRMED' or verified_by is not null
  ),
  constraint authority_processing_observations_override_check check (
    not operator_override or (length(trim(coalesce(override_reason, ''))) >= 10 and verified_by is not null)
  )
);

create index if not exists authority_processing_observations_authority_idx
  on public.authority_processing_observations(authority_id, service_type, observed_at desc);
create index if not exists authority_processing_observations_expires_idx
  on public.authority_processing_observations(expires_at);

-- Monitor baselines: one row per fetch of an official source.
create table if not exists public.authority_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.state_authorities(id) on delete restrict,
  source_url text not null,
  snapshot_hash text not null,
  facts jsonb not null default '{}'::jsonb,
  http_status integer,
  fetched_at timestamptz not null default now(),
  constraint authority_source_snapshots_hash_check check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  constraint authority_source_snapshots_official_check check (
    lower(source_url) ~ '^https://([a-z0-9-]+\.)*([a-z0-9-]+\.gov|state\.[a-z]{2}\.us)(/.*)?$'
  )
);
create index if not exists authority_source_snapshots_lookup_idx
  on public.authority_source_snapshots(authority_id, source_url, fetched_at desc);

-- Change-review queue. Operator decides; nothing here edits state_authorities.
create table if not exists public.authority_review_required (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.state_authorities(id) on delete restrict,
  source_url text not null,
  previous_snapshot_hash text not null,
  new_snapshot_hash text not null,
  change_detected text[] not null,
  detected_at timestamptz not null default now(),
  review_status text not null default 'PENDING',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  constraint authority_review_required_status_check check (review_status in ('PENDING', 'APPROVED', 'REJECTED')),
  constraint authority_review_required_change_check check (
    cardinality(change_detected) > 0
    and change_detected <@ array[
      'form_version_change', 'fee_change', 'submission_address_change',
      'processing_date_change', 'submission_method_change', 'authority_notice_change'
    ]::text[]
  ),
  constraint authority_review_required_hashes_differ check (previous_snapshot_hash <> new_snapshot_hash),
  constraint authority_review_required_decision_check check (
    review_status = 'PENDING' or (reviewed_by is not null and reviewed_at is not null and length(trim(coalesce(review_notes, ''))) >= 10)
  )
);
create unique index if not exists authority_review_required_dedupe_uidx
  on public.authority_review_required(authority_id, source_url, new_snapshot_hash);
create index if not exists authority_review_required_pending_idx
  on public.authority_review_required(authority_id) where review_status = 'PENDING';

alter table public.authority_processing_observations enable row level security;
alter table public.authority_source_snapshots enable row level security;
alter table public.authority_review_required enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['authority_processing_observations', 'authority_source_snapshots', 'authority_review_required'] loop
    execute format('drop policy if exists %I on public.%I', t || '_operator_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((auth.jwt() -> ''app_metadata'' ->> ''role'') in (''founder'',''founder_admin'',''admin'',''admin_operator'',''operator'',''superadmin'',''ops_manager'',''execution_coordinator'',''apostille_coordinator''))',
      t || '_operator_read', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_service_all', t);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', t || '_service_all', t);
  end loop;
end $$;

-- Operator decision on a detected change. Records the decision only: the
-- canonical authority record is updated separately through the governed
-- provenance review (VERIFIED only from an official source).
create or replace function public.decide_authority_review(
  p_review_id uuid,
  p_decision text,
  p_actor_id uuid,
  p_notes text
)
returns setof public.authority_review_required
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.authority_review_required%rowtype;
begin
  if p_decision not in ('APPROVED', 'REJECTED') then
    raise exception using errcode = '22023', message = 'INVALID_REVIEW_DECISION';
  end if;
  if coalesce(length(trim(p_notes)), 0) < 10 then
    raise exception using errcode = '22023', message = 'EVIDENCE_NOTE_REQUIRED';
  end if;
  update public.authority_review_required
  set review_status = p_decision,
      reviewed_by = p_actor_id,
      reviewed_at = clock_timestamp(),
      review_notes = left(trim(p_notes), 2000)
  where id = p_review_id and review_status = 'PENDING'
  returning * into v_row;
  if not found then
    raise exception using errcode = '22023', message = 'REVIEW_NOT_PENDING';
  end if;
  return next v_row;
end;
$$;

revoke all on function public.decide_authority_review(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.decide_authority_review(uuid, text, uuid, text) to service_role;

comment on table public.authority_processing_observations is
  'Source-backed, expiring authority processing observations. Estimates only; never a guaranteed completion date.';
comment on table public.authority_review_required is
  'Official-source changes detected by the authority monitor. Operator review only; never auto-applied to canonical authority records.';

commit;
