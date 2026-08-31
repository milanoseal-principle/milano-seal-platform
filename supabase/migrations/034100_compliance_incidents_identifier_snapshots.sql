-- 034_compliance_incidents_identifier_snapshots_FIXED.sql
-- Replay-safe reconciliation over the earlier 034 compliance schema.
-- Removes dependency on public.profiles and preserves legacy incident data.

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

create or replace function public.is_founder_or_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder', 'founder_admin', 'admin', 'admin_operator', 'superadmin')
    or
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder', 'founder_admin', 'admin', 'admin_operator', 'superadmin'),
    false
  );
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'incident_severity') then
    create type public.incident_severity as enum ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum (
      'INCIDENT_OPENED',
      'RECORDS_PRESERVED',
      'ROOT_CAUSE_REVIEW',
      'CLIENT_IMPACT_REVIEW',
      'CORRECTION_PLAN_DRAFTED',
      'FOUNDER_APPROVED_RESPONSE',
      'CLIENT_NOTIFIED',
      'CORRECTION_EXECUTED',
      'DISCOUNT_OR_COURTESY_REVIEW',
      'FINAL_QA_COMPLETED',
      'MATTER_RESTORED_OR_CLOSED',
      'CLOSED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_type') then
    create type public.incident_type as enum (
      'IDENTIFIER_ERROR',
      'DOCUMENT_VERSION_ERROR',
      'MISSING_SIGNATURE',
      'MISSING_INITIAL',
      'NOTARY_BLOCK_ERROR',
      'WRONG_DESTINATION_COUNTRY',
      'WRONG_APOSTILLE_ROUTE',
      'HAGUE_NON_HAGUE_MISMATCH',
      'CONSULAR_AUTHENTICATION_REQUIRED',
      'TRANSLATION_REVIEW_REQUIRED',
      'COURIER_EXCEPTION',
      'CUSTOMS_EXCEPTION',
      'PAYMENT_RECONCILIATION_EXCEPTION',
      'CLIENT_DELIVERY_COMPLAINT',
      'RECEIVING_AUTHORITY_REJECTION',
      'AI_FIELD_MODIFICATION_ERROR',
      'OPERATOR_QA_MISS',
      'FINAL_PACKET_ERROR'
    );
  end if;
end $$;

create table if not exists public.compliance_incidents (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid null,
  incident_type public.incident_type not null,
  severity public.incident_severity not null default 'MODERATE',
  status public.incident_status not null default 'INCIDENT_OPENED',
  release_frozen boolean not null default true,
  document_already_released boolean not null default false,
  apostille_already_submitted boolean not null default false,
  client_impact_level text null,
  financial_exposure_estimate numeric(12,2) null,
  foreign_authority_deadline timestamptz null,
  summary text not null,
  internal_notes text null,
  client_safe_message text null,
  correction_plan text null,
  founder_review_status text not null default 'PENDING',
  counsel_review_status text not null default 'NOT_REQUESTED',
  insurance_review_status text not null default 'NOT_REQUESTED',
  opened_by uuid null references auth.users(id) on delete set null,
  assigned_to uuid null references auth.users(id) on delete set null,
  closed_by uuid null references auth.users(id) on delete set null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_audit_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.compliance_incidents(id) on delete cascade,
  matter_id uuid null,
  action text not null,
  from_status text null,
  to_status text null,
  actor_id uuid null references auth.users(id) on delete set null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.critical_identifier_snapshots (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid null,
  incident_id uuid null references public.compliance_incidents(id) on delete set null,
  field_type text not null,
  field_label text null,
  source_value text null,
  generated_document_value text null,
  executed_document_value text null,
  apostille_packet_value text null,
  final_packet_value text null,
  mismatch_detected boolean not null default false,
  qa_required boolean not null default true,
  confirmed_value text null,
  confirmed_by uuid null references auth.users(id) on delete set null,
  confirmed_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint critical_identifier_field_type_check check (
    field_type in (
      'foreign_tax_code','fiscale_code','passport_number','national_id_number',
      'bank_account_number','routing_number','case_number','court_number',
      'property_registry_number','business_registry_number','birth_date',
      'place_of_birth','foreign_address','receiving_authority_reference',
      'apostille_certificate_number','notary_commission_number','other'
    )
  )
);

alter table public.compliance_incidents
  add column if not exists matter_id uuid null,
  add column if not exists release_frozen boolean not null default true,
  add column if not exists document_already_released boolean not null default false,
  add column if not exists apostille_already_submitted boolean not null default false,
  add column if not exists client_impact_level text null,
  add column if not exists financial_exposure_estimate numeric(12,2) null,
  add column if not exists foreign_authority_deadline timestamptz null,
  add column if not exists summary text null,
  add column if not exists internal_notes text null,
  add column if not exists client_safe_message text null,
  add column if not exists correction_plan text null,
  add column if not exists founder_review_status text not null default 'PENDING',
  add column if not exists counsel_review_status text not null default 'NOT_REQUESTED',
  add column if not exists insurance_review_status text not null default 'NOT_REQUESTED',
  add column if not exists opened_by uuid null references auth.users(id) on delete set null,
  add column if not exists closed_by uuid null references auth.users(id) on delete set null,
  add column if not exists closed_at timestamptz null;

alter table public.incident_audit_log
  add column if not exists matter_id uuid null,
  add column if not exists from_status text null,
  add column if not exists to_status text null,
  add column if not exists actor_id uuid null references auth.users(id) on delete set null;

alter table public.critical_identifier_snapshots
  add column if not exists matter_id uuid null,
  add column if not exists field_label text null,
  add column if not exists source_value text null,
  add column if not exists generated_document_value text null,
  add column if not exists executed_document_value text null,
  add column if not exists apostille_packet_value text null,
  add column if not exists final_packet_value text null,
  add column if not exists mismatch_detected boolean not null default false,
  add column if not exists qa_required boolean not null default true,
  add column if not exists confirmed_value text null,
  add column if not exists confirmed_by uuid null references auth.users(id) on delete set null,
  add column if not exists confirmed_at timestamptz null,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_compliance_incidents_updated_at on public.compliance_incidents;
create trigger trg_compliance_incidents_updated_at
before update on public.compliance_incidents
for each row execute function public.set_updated_at();

drop trigger if exists trg_critical_identifier_snapshots_updated_at on public.critical_identifier_snapshots;
create trigger trg_critical_identifier_snapshots_updated_at
before update on public.critical_identifier_snapshots
for each row execute function public.set_updated_at();

create index if not exists idx_compliance_incidents_matter_id on public.compliance_incidents(matter_id);
create index if not exists idx_compliance_incidents_status on public.compliance_incidents(status);
create index if not exists idx_compliance_incidents_severity on public.compliance_incidents(severity);
create index if not exists idx_incident_audit_log_incident_id on public.incident_audit_log(incident_id);
create index if not exists idx_critical_identifier_snapshots_matter_id on public.critical_identifier_snapshots(matter_id);
create index if not exists idx_critical_identifier_snapshots_mismatch on public.critical_identifier_snapshots(mismatch_detected);

alter table public.compliance_incidents enable row level security;
alter table public.incident_audit_log enable row level security;
alter table public.critical_identifier_snapshots enable row level security;

drop policy if exists "Founder and admin manage compliance incidents" on public.compliance_incidents;
create policy "Founder and admin manage compliance incidents"
on public.compliance_incidents for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());

drop policy if exists "Founder and admin manage incident audit log" on public.incident_audit_log;
create policy "Founder and admin manage incident audit log"
on public.incident_audit_log for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());

drop policy if exists "Founder and admin manage critical identifier snapshots" on public.critical_identifier_snapshots;
create policy "Founder and admin manage critical identifier snapshots"
on public.critical_identifier_snapshots for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());
