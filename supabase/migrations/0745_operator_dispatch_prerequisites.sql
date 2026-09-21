begin;

-- Canonical prerequisites for governed dispatch.
--
-- Historical deployments created these objects through operator/portal SQL
-- scripts. Fresh Supabase branches replay only supabase/migrations, so migration
-- 075 could not enforce its operator assignment foreign keys. Promote the
-- minimum authoritative schema into the migration chain before 075. Existing
-- production objects are preserved through IF NOT EXISTS and additive ALTERs.

create table if not exists public.operator_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text,
  firm_name text,
  region text,
  state text,
  city text,
  coverage_radius_miles integer not null default 50,
  secondary_states text[],
  notary_commission_number text,
  notary_commission_expires timestamptz,
  onboarding_status text not null default 'invited',
  background_verified boolean not null default false,
  identity_verified boolean not null default false,
  ron_capable boolean not null default false,
  mobile_capable boolean not null default false,
  apostille_runner_capable boolean not null default false,
  courier_capable boolean not null default false,
  admin_approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  suspended_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Preserve the locked onboarding vocabulary without assuming the legacy script
-- was previously executed.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.operator_profiles'::regclass
      and conname = 'operator_profiles_onboarding_status_check'
  ) then
    alter table public.operator_profiles
      add constraint operator_profiles_onboarding_status_check
      check (onboarding_status in (
        'invited','profile_started','documents_pending','training_pending',
        'toolbelt_pending','compliance_review','approved','suspended','rejected'
      ));
  end if;
end $$;

create index if not exists operator_profiles_state_idx
  on public.operator_profiles(state);
create index if not exists operator_profiles_onboarding_idx
  on public.operator_profiles(onboarding_status, admin_approved);

alter table public.operator_profiles enable row level security;
drop policy if exists svc_operator_profiles on public.operator_profiles;
create policy svc_operator_profiles
  on public.operator_profiles
  for all
  to service_role
  using (true)
  with check (true);
revoke all on public.operator_profiles from anon, authenticated;
grant select, insert, update, delete on public.operator_profiles to service_role;

create table if not exists public.operator_assignments (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operator_profiles(id) on delete restrict,
  deal_id uuid not null references public.deals(id) on delete restrict,
  assigned_by text not null,
  assignment_status text not null default 'offered',
  dispatch_confirmed boolean not null default false,
  idempotency_key text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.operator_assignments'::regclass
      and conname = 'operator_assignments_assignment_status_check'
  ) then
    alter table public.operator_assignments
      add constraint operator_assignments_assignment_status_check
      check (assignment_status in (
        'offered','accepted','declined','in_progress','completed','reassigned','cancelled'
      ));
  end if;
end $$;

create index if not exists operator_assignments_operator_status_idx
  on public.operator_assignments(operator_id, assignment_status, created_at desc);
create index if not exists operator_assignments_deal_idx
  on public.operator_assignments(deal_id, created_at desc);

alter table public.operator_assignments enable row level security;
drop policy if exists svc_operator_assignments on public.operator_assignments;
create policy svc_operator_assignments
  on public.operator_assignments
  for all
  to service_role
  using (true)
  with check (true);
revoke all on public.operator_assignments from anon, authenticated;
grant select, insert, update, delete on public.operator_assignments to service_role;

-- Matter events are the append-only operational timeline consumed by governed
-- dispatch, admin override evidence, portal projections, and ledger read models.
create table if not exists public.matter_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete cascade,
  event_type text not null,
  notes text,
  actor text,
  client_visible boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.matter_events
  add column if not exists actor_type text;

create index if not exists idx_matter_events_matter
  on public.matter_events(matter_id);
create index if not exists idx_matter_events_visible
  on public.matter_events(matter_id, client_visible);
create index if not exists idx_matter_events_created
  on public.matter_events(created_at desc);

alter table public.matter_events enable row level security;
drop policy if exists svc_matter_events on public.matter_events;
create policy svc_matter_events
  on public.matter_events
  for all
  to service_role
  using (true)
  with check (true);
revoke all on public.matter_events from anon, authenticated;
grant select, insert, update, delete on public.matter_events to service_role;

comment on table public.operator_profiles is
  'Canonical operator identity/capability root used by governed dispatch.';
comment on table public.operator_assignments is
  'Governed operator-to-Matter dispatch assignment record.';
comment on table public.matter_events is
  'Append-only operational Matter event timeline and evidence source.';

commit;
