begin;

-- 059_reconcile_compliance_and_notary_network.sql
-- Canonical replay reconciliation for the historical duplicate 034/036 families.
-- Additive only: preserves legacy rows/columns and does not create Matter,
-- payment, scheduling, execution, custody, courier, delivery or release authority.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

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

-- ---------------------------------------------------------------------------
-- Compliance incident compatibility
-- ---------------------------------------------------------------------------

alter table public.compliance_incidents
  add column if not exists matter_id uuid,
  add column if not exists release_frozen boolean not null default true,
  add column if not exists document_already_released boolean not null default false,
  add column if not exists apostille_already_submitted boolean not null default false,
  add column if not exists client_impact_level text,
  add column if not exists financial_exposure_estimate numeric(12,2),
  add column if not exists foreign_authority_deadline timestamptz,
  add column if not exists summary text,
  add column if not exists internal_notes text,
  add column if not exists client_safe_message text,
  add column if not exists correction_plan text,
  add column if not exists founder_review_status text not null default 'PENDING',
  add column if not exists counsel_review_status text not null default 'NOT_REQUESTED',
  add column if not exists insurance_review_status text not null default 'NOT_REQUESTED',
  add column if not exists opened_by uuid references auth.users(id) on delete set null,
  add column if not exists closed_by uuid references auth.users(id) on delete set null,
  add column if not exists closed_at timestamptz;

-- Newer incident writers may use summary/actor evidence without legacy title,
-- actor or field-value text. Preserve those columns but do not require them.
alter table public.compliance_incidents alter column title drop not null;
alter table public.incident_audit_log alter column actor drop not null;
alter table public.critical_identifier_snapshots alter column field_value drop not null;
alter table public.critical_identifier_snapshots alter column captured_by drop not null;

alter table public.compliance_incidents
  drop constraint if exists compliance_incidents_severity_check,
  drop constraint if exists compliance_incidents_status_check;

alter table public.compliance_incidents
  add constraint compliance_incidents_severity_check check (
    severity in ('low','medium','high','critical','LOW','MODERATE','HIGH','CRITICAL')
  ),
  add constraint compliance_incidents_status_check check (
    status in (
      'OPEN','INVESTIGATING','REMEDIATION_IN_PROGRESS','PENDING_CLIENT','RESOLVED','CLOSED','FROZEN',
      'INCIDENT_OPENED','RECORDS_PRESERVED','ROOT_CAUSE_REVIEW','CLIENT_IMPACT_REVIEW',
      'CORRECTION_PLAN_DRAFTED','FOUNDER_APPROVED_RESPONSE','CLIENT_NOTIFIED',
      'CORRECTION_EXECUTED','DISCOUNT_OR_COURTESY_REVIEW','FINAL_QA_COMPLETED',
      'MATTER_RESTORED_OR_CLOSED'
    )
  );

alter table public.incident_audit_log
  add column if not exists matter_id uuid,
  add column if not exists from_status text,
  add column if not exists to_status text,
  add column if not exists actor_id uuid references auth.users(id) on delete set null;

alter table public.critical_identifier_snapshots
  add column if not exists matter_id uuid,
  add column if not exists field_label text,
  add column if not exists source_value text,
  add column if not exists generated_document_value text,
  add column if not exists executed_document_value text,
  add column if not exists apostille_packet_value text,
  add column if not exists final_packet_value text,
  add column if not exists mismatch_detected boolean not null default false,
  add column if not exists qa_required boolean not null default true,
  add column if not exists confirmed_value text,
  add column if not exists confirmed_by uuid references auth.users(id) on delete set null,
  add column if not exists confirmed_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_compliance_incidents_matter_id
  on public.compliance_incidents(matter_id);
create index if not exists idx_critical_identifier_snapshots_matter_id
  on public.critical_identifier_snapshots(matter_id);
create index if not exists idx_critical_identifier_snapshots_mismatch
  on public.critical_identifier_snapshots(mismatch_detected);

drop trigger if exists trg_compliance_incidents_updated_at on public.compliance_incidents;
create trigger trg_compliance_incidents_updated_at
before update on public.compliance_incidents
for each row execute function public.set_updated_at();

drop trigger if exists trg_critical_identifier_snapshots_updated_at on public.critical_identifier_snapshots;
create trigger trg_critical_identifier_snapshots_updated_at
before update on public.critical_identifier_snapshots
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notary network compatibility
-- ---------------------------------------------------------------------------

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
    ron_authorized = coalesce(is_ron_certified, ron_authorized, false),
    mobile_notary_available = coalesce(is_mobile_notary, mobile_notary_available, false),
    e_and_o_insurance_provider = coalesce(e_and_o_insurance_provider, eo_carrier)
where state_commissioned is null
   or commission_expiration is null
   or e_and_o_insurance_provider is null;

alter table public.notary_applications alter column state_commissioned set not null;
alter table public.notary_applications drop constraint if exists notary_applications_status_check;
alter table public.notary_applications
  add constraint notary_applications_status_check check (
    status in (
      'PENDING','UNDER_REVIEW','WAITLISTED','APPLICATION_RECEIVED','DOCUMENTS_PENDING',
      'CREDENTIAL_REVIEW','INTERVIEW_REQUIRED','APPROVED','ACTIVE','SUSPENDED',
      'REJECTED','EXPIRED_CREDENTIALS'
    )
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
    ron_authorized = coalesce(is_ron_certified, ron_authorized, false),
    mobile_notary_available = coalesce(is_mobile_notary, mobile_notary_available, false),
    e_and_o_insurance_provider = coalesce(e_and_o_insurance_provider, eo_carrier)
where state_commissioned is null
   or commission_expiration is null
   or e_and_o_insurance_provider is null;

alter table public.notary_credentials alter column state_commissioned set not null;

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

create index if not exists idx_notary_assignments_matter_id
  on public.notary_assignments(matter_id);
create index if not exists idx_notary_assignments_status
  on public.notary_assignments(assignment_status);

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

comment on table public.compliance_incidents is
  'Compliance incident system reconciled across historical schemas; canonical Matter authority remains deals and governed Matter state.';
comment on table public.notary_assignments is
  'Notary execution coordination projection; canonical payment and scheduling gates remain outside this table.';

commit;
