-- 036_notary_network_FIXED.sql
-- notary_application_status enum: APPLICATION_RECEIVED, DOCUMENTS_PENDING, CREDENTIAL_REVIEW,
--   INTERVIEW_REQUIRED, APPROVED, ACTIVE, SUSPENDED, REJECTED, EXPIRED_CREDENTIALS
-- ron_platforms_used: text[], languages: text[]
-- blue_notary_experience: boolean, remote_online_notary_certification: boolean

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.is_founder_or_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder', 'admin')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder', 'admin'),
    false
  );
$$;

create or replace function public.is_founder_admin_or_alliance()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder', 'admin', 'alliance')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder', 'admin', 'alliance'),
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

drop trigger if exists trg_notary_applications_updated_at on public.notary_applications;
create trigger trg_notary_applications_updated_at
before update on public.notary_applications
for each row execute function public.set_updated_at();

drop trigger if exists trg_notary_credentials_updated_at on public.notary_credentials;
create trigger trg_notary_credentials_updated_at
before update on public.notary_credentials
for each row execute function public.set_updated_at();

drop trigger if exists trg_notary_assignments_updated_at on public.notary_assignments;
create trigger trg_notary_assignments_updated_at
before update on public.notary_assignments
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
