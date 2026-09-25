begin;

-- Professional referral + counsel execution engine.
-- Additive/idempotent. The canonical Matter (public.deals) remains the single
-- source of truth; professionals are linked to Matters by reference only.
-- There is no professional_matter / lawyer_matter / referral_matter table.

create table if not exists public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  firm_name text not null,
  contact_name text not null,
  title text,
  email text not null,
  phone text,
  country text,
  city text,
  website text,
  practice_focus text,
  preferred_language text,
  preferred_destination_countries text[] not null default '{}',
  typical_document_types text[] not null default '{}',
  preferred_execution_method text,
  default_receiving_authority text,
  default_client_handoff_mode text not null default 'professional_submits',
  client_instruction_template text,
  notification_preference text not null default 'all_milestones',
  status text not null default 'prospect',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.professional_profiles
  drop constraint if exists professional_profiles_status_check;
alter table public.professional_profiles
  add constraint professional_profiles_status_check
  check (status in ('prospect', 'active', 'paused', 'inactive'));

alter table public.professional_profiles
  drop constraint if exists professional_profiles_handoff_mode_check;
alter table public.professional_profiles
  add constraint professional_profiles_handoff_mode_check
  check (default_client_handoff_mode in ('professional_submits', 'client_completes'));

alter table public.professional_profiles
  drop constraint if exists professional_profiles_notification_preference_check;
alter table public.professional_profiles
  add constraint professional_profiles_notification_preference_check
  check (notification_preference in ('all_milestones', 'key_milestones', 'exceptions_only'));

-- One profile per email, case-insensitively. Returning professionals resolve
-- to the same record instead of creating duplicates.
create unique index if not exists professional_profiles_email_unique
  on public.professional_profiles (lower(email));

create index if not exists professional_profiles_status_idx
  on public.professional_profiles (status);

alter table public.professional_profiles enable row level security;

drop policy if exists "service_role_professional_profiles" on public.professional_profiles;
create policy "service_role_professional_profiles"
  on public.professional_profiles for all to service_role
  using (true) with check (true);

-- A signed-in professional may read only their own profile. All writes go
-- through server routes using the service role.
drop policy if exists "professional_reads_own_profile" on public.professional_profiles;
create policy "professional_reads_own_profile"
  on public.professional_profiles for select to authenticated
  using (user_id = auth.uid());

-- Matter relationship fields (canonical Matter stays the source of truth).
alter table public.deals
  add column if not exists professional_profile_id uuid,
  add column if not exists referral_source_type text,
  add column if not exists referral_source_id text,
  add column if not exists referral_reference text;

alter table public.deals
  drop constraint if exists deals_professional_profile_fk;
alter table public.deals
  add constraint deals_professional_profile_fk
  foreign key (professional_profile_id)
  references public.professional_profiles(id)
  on delete set null;

alter table public.deals
  drop constraint if exists deals_referral_source_type_check;
alter table public.deals
  add constraint deals_referral_source_type_check
  check (
    referral_source_type is null or referral_source_type in (
      'professional_submitted',
      'professional_client_handoff'
    )
  );

create index if not exists deals_professional_profile_idx
  on public.deals (professional_profile_id, created_at desc)
  where professional_profile_id is not null;

-- Not unique: a client may legitimately reuse one handoff link (e.g. a
-- resubmission). Attribution stays on the profile either way.
create index if not exists deals_referral_reference_idx
  on public.deals (referral_reference)
  where referral_reference is not null;

comment on table public.professional_profiles is
  'Canonical counsel/professional profile. Stores firm-level defaults only; never client PII, signer identification, passport data or Matter-specific legal conclusions.';
comment on column public.deals.professional_profile_id is
  'Referring professional. Ownership boundary for the professional Matter dashboard.';
comment on column public.deals.referral_reference is
  'Opaque Matter referral reference carried by governed client handoff links.';

commit;
