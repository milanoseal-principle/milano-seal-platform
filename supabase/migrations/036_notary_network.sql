-- 036_notary_network_FIXED.sql
-- Replay-safe reconciliation over the earlier 036 notary application schema.
-- Preserves legacy columns/data while adding the governed network fields.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.is_founder_or_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','superadmin')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','superadmin'),
    false
  );
$$;

create or replace function public.is_founder_admin_or_alliance()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','superadmin','alliance')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','superadmin','alliance'),
    false
  );
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notary_application_status') then
    create type public.notary_application_status as enum (
      'APPLICATION_RECEIVED','DOCUMENTS_PENDING','CREDENTIAL_REVIEW',
      'INTERVIEW_REQUIRED','APPROVED','ACTIVE','SUSPENDED','REJECTED','EXPIRED_CREDENTIALS'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'notary_assignment_status') then
    create type public.notary_assignment_status as enum (
      'ASSIGNED','ACCEPTED','DECLINED','IN_PROGRESS','COMPLETED',
      'FLAGGED_FOR_OPERATOR_REVIEW','CANCELLED'
    );
  end if;
end $$;

create table if not exists public.notary_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text null,
  state_commissioned text not null,
  commission_number text null,
  commission_expiration date null,
  ron_authorized boolean not null default false,
  ron_platforms_used text[] not null default '{}'::text[],
  blue_notary_experience boolean not null default false,
  remote_online_notary_certification boolean not null default false,
  e_and_o_insurance_provider text null,
  e_and_o_policy_limit text null,
  background_check_status text null,
  languages text[] not null default '{}'::text[],
  availability text null,
  mobile_notary_available boolean not null default false,
  apostille_experience boolean not null default false,
  international_document_experience boolean not null default false,
  shipping_dropoff_access boolean not null default false,
  preferred_service_area text null,
  w9_status text null,
  payout_method text null,
  notes text null,
  notary_commission_certificate_url text null,
  ron_authorization_document_url text null,
  e_and_o_certificate_url text null,
  government_id_url text null,
  w9_form_url text null,
  background_check_proof_url text null,
  sample_notarial_certificate_url text null,
  status public.notary_application_status not null default 'APPLICATION_RECEIVED',
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  review_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notary_credentials (
  id uuid primary key default gen_random_uuid(),
  application_id uuid null references public.notary_applications(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  state_commissioned text not null,
  commission_number text null,
  commission_expiration date null,
  ron_authorized boolean not null default false,
  e_and_o_insurance_provider text null,
  e_and_o_policy_limit text null,
  credential_status public.notary_application_status not null default 'ACTIVE',
  languages text[] not null default '{}'::text[],
  preferred_service_area text null,
  mobile_notary_available boolean not null default false,
  apostille_experience boolean not null default false,
  international_document_experience boolean not null default false,
  active boolean not null default true,
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notary_assignments (
  id uuid primary key default gen_random_uuid(),
  notary_credential_id uuid not null references public.notary_credentials(id) on delete restrict,
  matter_id uuid null,
  assignment_status public.notary_assignment_status not null default 'ASSIGNED',
  document_type text null,
  signer_location text null,
  signer_state text null,
  ron_required boolean not null default false,
  deadline timestamptz null,
  notary_instructions text null,
  shipping_instructions text null,
  confidence_panel jsonb not null default '{}'::jsonb,
  escalation_reason text null,
  operator_notes text null,
  assigned_by uuid null references auth.users(id) on delete set null,
  accepted_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Earlier 036 may already own these tables. Add only missing governed network
-- fields and preserve legacy commission/status/provider columns unchanged.
alter table public.notary_applications
  add column if not exists state_commissioned text,
  add column if not exists commission_expiration date,
  add column if not exists ron_authorized boolean not null default false,
  add column if not exists ron_platforms_used text[] not null default '{}'::text[],
  add column if not exists blue_notary_experience boolean not null default false,
  add column if not exists remote_online_notary_certification boolean not null default false,
  add column if not exists e_and_o_insurance_provider text,
  add column if not exists e_and_o_policy_limit text,
  add column if not exists background_check_status text,
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists availability text,
  add column if not exists mobile_notary_available boolean not null default false,
  add column if not exists apostille_experience boolean not null default false,
  add column if not exists international_document_experience boolean not null default false,
  add column if not exists shipping_dropoff_access boolean not null default false,
  add column if not exists preferred_service_area text,
  add column if not exists w9_status text,
  add column if not exists payout_method text,
  add column if not exists notary_commission_certificate_url text,
  add column if not exists ron_authorization_document_url text,
  add column if not exists e_and_o_certificate_url text,
  add column if not exists government_id_url text,
  add column if not exists w9_form_url text,
  add column if not exists background_check_proof_url text,
  add column if not exists sample_notarial_certificate_url text,
  add column if not exists review_notes text;

update public.notary_applications
set state_commissioned = coalesce(state_commissioned, state_of_commission),
    commission_expiration = coalesce(commission_expiration, commission_expiry),
    ron_authorized = coalesce(ron_authorized, is_ron_certified, false),
    mobile_notary_available = coalesce(mobile_notary_available, is_mobile_notary, false),
    e_and_o_insurance_provider = coalesce(e_and_o_insurance_provider, eo_carrier)
where state_commissioned is null
   or commission_expiration is null
   or e_and_o_insurance_provider is null;

alter table public.notary_applications
  alter column state_commissioned set not null;

-- Legacy status is text with a narrower check. Keep text to avoid destructive
-- coercion and broaden the accepted lifecycle values.
alter table public.notary_applications
  drop constraint if exists notary_applications_status_check;
alter table public.notary_applications
  add constraint notary_applications_status_check check (
    status in ('PENDING','UNDER_REVIEW','WAITLISTED','APPLICATION_RECEIVED','DOCUMENTS_PENDING','CREDENTIAL_REVIEW','INTERVIEW_REQUIRED','APPROVED','ACTIVE','SUSPENDED','REJECTED','EXPIRED_CREDENTIALS')
  );

alter table public.notary_credentials
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists state_commissioned text,
  add column if not exists commission_expiration date,
  add column if not exists ron_authorized boolean not null default false,
  add column if not exists e_and_o_insurance_provider text,
  add column if not exists e_and_o_policy_limit text,
  add column if not exists credential_status public.notary_application_status not null default 'ACTIVE',
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists preferred_service_area text,
  add column if not exists mobile_notary_available boolean not null default false,
  add column if not exists apostille_experience boolean not null default false,
  add column if not exists international_document_experience boolean not null default false,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

update public.notary_credentials
set state_commissioned = coalesce(state_commissioned, state_of_commission),
    commission_expiration = coalesce(commission_expiration, commission_expiry),
    ron_authorized = coalesce(ron_authorized, is_ron_certified, false),
    mobile_notary_available = coalesce(mobile_notary_available, is_mobile_notary, false),
    e_and_o_insurance_provider = coalesce(e_and_o_insurance_provider, eo_carrier)
where state_commissioned is null
   or commission_expiration is null
   or e_and_o_insurance_provider is null;

alter table public.notary_credentials
  alter column state_commissioned set not null;

alter table public.notary_assignments
  add column if not exists matter_id uuid,
  add column if not exists assignment_status public.notary_assignment_status not null default 'ASSIGNED',
  add column if not exists document_type text,
  add column if not exists signer_location text,
  add column if not exists signer_state text,
  add column if not exists ron_required boolean not null default false,
  add column if not exists deadline timestamptz,
  add column if not exists notary_instructions text,
  add column if not exists shipping_instructions text,
  add column if not exists confidence_panel jsonb not null default '{}'::jsonb,
  add column if not exists escalation_reason text,
  add column if not exists operator_notes text,
  add column if not exists accepted_at timestamptz;

drop trigger if exists trg_notary_applications_updated_at on public.notary_applications;
create trigger trg_notary_applications_updated_at before update on public.notary_applications
for each row execute function public.set_updated_at();

drop trigger if exists trg_notary_credentials_updated_at on public.notary_credentials;
create trigger trg_notary_credentials_updated_at before update on public.notary_credentials
for each row execute function public.set_updated_at();

drop trigger if exists trg_notary_assignments_updated_at on public.notary_assignments;
create trigger trg_notary_assignments_updated_at before update on public.notary_assignments
for each row execute function public.set_updated_at();

create index if not exists idx_notary_applications_email on public.notary_applications(email);
create index if not exists idx_notary_applications_status on public.notary_applications(status);
create index if not exists idx_notary_credentials_email on public.notary_credentials(email);
create index if not exists idx_notary_credentials_active on public.notary_credentials(active);
create index if not exists idx_notary_assignments_matter_id on public.notary_assignments(matter_id);
create index if not exists idx_notary_assignments_status on public.notary_assignments(assignment_status);
create index if not exists idx_notary_assignments_notary_id on public.notary_assignments(notary_credential_id);

alter table public.notary_applications enable row level security;
alter table public.notary_credentials enable row level security;
alter table public.notary_assignments enable row level security;

drop policy if exists "Public can submit notary applications" on public.notary_applications;
create policy "Public can submit notary applications"
on public.notary_applications for insert to anon, authenticated with check (true);

drop policy if exists "Founder admin alliance manage notary applications" on public.notary_applications;
create policy "Founder admin alliance manage notary applications"
on public.notary_applications for all to authenticated
using (public.is_founder_admin_or_alliance()) with check (public.is_founder_admin_or_alliance());

drop policy if exists "Founder admin alliance manage notary credentials" on public.notary_credentials;
create policy "Founder admin alliance manage notary credentials"
on public.notary_credentials for all to authenticated
using (public.is_founder_admin_or_alliance()) with check (public.is_founder_admin_or_alliance());

drop policy if exists "Founder admin alliance manage notary assignments" on public.notary_assignments;
create policy "Founder admin alliance manage notary assignments"
on public.notary_assignments for all to authenticated
using (public.is_founder_admin_or_alliance()) with check (public.is_founder_admin_or_alliance());
