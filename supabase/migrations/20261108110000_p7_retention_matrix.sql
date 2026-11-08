-- P7: formal retention matrix. One canonical registry of retention classes that governs
-- public.retention_records (P5). Unresolved durations are review_required, never guessed.
begin;

create table if not exists public.retention_classes (
  class_id text primary key,
  canonical_name text not null,
  description text not null,
  basis text,
  duration_rule text not null,
  duration_years integer check (duration_years is null or duration_years between 1 and 100),
  start_event text not null,
  start_timestamp_source text not null,
  deletion_eligible boolean not null default false,
  hold_eligible boolean not null default true,
  sensitivity text not null check (sensitivity in ('public','internal','confidential','restricted')),
  deletion_method text not null,
  required_deletion_evidence text not null,
  system_of_record text not null,
  owner_subsystem text not null,
  policy_status text not null default 'review_required' check (policy_status in ('resolved','review_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (policy_status <> 'resolved' or (duration_years is not null and basis is not null))
);

insert into public.retention_classes (class_id, canonical_name, description, basis, duration_rule, duration_years, start_event,
  start_timestamp_source, deletion_eligible, hold_eligible, sensitivity, deletion_method, required_deletion_evidence,
  system_of_record, owner_subsystem, policy_status)
values
  ('RON_STATUTORY_EVIDENCE','RON statutory evidence','RON journal, A/V recording, executed artifacts and session evidence',
   'Florida RON journal/recording retention (applies where the commissioning jurisdiction is Florida)','FL_RON_10Y',10,
   'RON_EXECUTION_COMPLETED','ron_sessions.execution_completed_at',true,true,'restricted',
   'storage object purge or provider-confirmed deletion','retention_deletion_events deleted row + provider/storage evidence',
   'ron_sessions/ron_documents/document_versions','ron','resolved'),
  ('MATTER_RECORD','Matter record','Canonical Matter (public.deals) and lifecycle events',null,'REVIEW_REQUIRED',null,'MATTER_CLOSED','deals.updated_at',false,true,'confidential','owner-approved archival','retention_deletion_events','deals','matter','review_required'),
  ('INTAKE_AND_LEAD','Intakes, sales leads and pricing requests','Pre-Matter acquisition records',null,'REVIEW_REQUIRED',null,'LEAD_CLOSED_OR_CONVERTED','sales_leads.updated_at',true,true,'confidential','row purge','retention_deletion_events','sales_leads','acquisition','review_required'),
  ('CLIENT_UPLOAD','Uploads and source documents','Client-supplied source documents',null,'REVIEW_REQUIRED',null,'MATTER_CLOSED','files.created_at',true,true,'restricted','storage object purge','retention_deletion_events + storage evidence','files/document_versions','documents','review_required'),
  ('EXECUTED_DOCUMENT','Executed documents (non-RON)','In-person/mobile executed artifacts',null,'REVIEW_REQUIRED',null,'EXECUTION_COMPLETED','document_versions.created_at',true,true,'restricted','storage object purge','retention_deletion_events + storage evidence','document_versions','documents','review_required'),
  ('PAYMENT_RECORD','Wise payment, invoice and receipt records','Financial truth and outputs',null,'REVIEW_REQUIRED',null,'PAYMENT_SETTLED','deals.payment_confirmed_at',false,true,'confidential','owner-approved archival','retention_deletion_events','deals/wise tables','payments','review_required'),
  ('CUSTODY_EVIDENCE','Chain of custody and execution evidence','Custody ledger and matter evidence ledger',null,'REVIEW_REQUIRED',null,'MATTER_CLOSED','custody_ledger.created_at',false,true,'confidential','not deletable while dependent evidence is retained','retention_deletion_events','custody_ledger/matter_evidence_ledger','custody','review_required'),
  ('AUTHENTICATION_COURIER','Apostille/authentication and courier evidence','Submission, receipt, label and tracking evidence',null,'REVIEW_REQUIRED',null,'MATTER_CLOSED','custody_ledger.created_at',true,true,'confidential','row/storage purge','retention_deletion_events','apostille/courier tables','authentication','review_required'),
  ('NOTIFICATION_RECORD','Notifications','Notification evidence',null,'REVIEW_REQUIRED',null,'NOTIFICATION_SENT','notifications.created_at',true,true,'internal','row purge','retention_deletion_events','notifications','notifications','review_required'),
  ('POLICY_ACCEPTANCE','Policy acceptance','Versioned policy acceptance evidence',null,'REVIEW_REQUIRED',null,'MATTER_CLOSED','policy_acceptances.accepted_at',false,true,'confidential','not deletable while governing a transaction','retention_deletion_events','policy_acceptances','policy','review_required'),
  ('SECURITY_AUDIT','Audit, security, incidents and records requests','Security events, incidents, records requests, operator notes',null,'REVIEW_REQUIRED',null,'INCIDENT_OR_REQUEST_CLOSED','compliance_incidents.closed_at',false,true,'restricted','owner-approved archival','retention_deletion_events','compliance_incidents/ron_records_requests/security_events','security','review_required'),
  ('COUNSEL_INQUIRY','Professional/counsel inquiries','Counsel and professional inquiries',null,'REVIEW_REQUIRED',null,'INQUIRY_CLOSED','created_at',true,true,'confidential','row purge','retention_deletion_events','sales_leads','acquisition','review_required')
on conflict (class_id) do nothing;

create or replace function public.protect_retention_class()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then raise exception using errcode = '42501', message = 'RETENTION_CLASS_IMMUTABLE'; end if;
  if OLD.policy_status = 'resolved' and (NEW.duration_rule, NEW.duration_years, NEW.basis, NEW.start_event, NEW.policy_status)
     is distinct from (OLD.duration_rule, OLD.duration_years, OLD.basis, OLD.start_event, OLD.policy_status) then
    raise exception using errcode = '42501', message = 'RESOLVED_RETENTION_CLASS_IMMUTABLE';
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
revoke all on function public.protect_retention_class() from public, anon, authenticated;
drop trigger if exists protect_retention_class on public.retention_classes;
create trigger protect_retention_class before update or delete on public.retention_classes
  for each row execute function public.protect_retention_class();

-- Every retention record belongs to a registered class (cross-class isolation).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'retention_records_class_fk') then
    alter table public.retention_records add constraint retention_records_class_fk
      foreign key (retention_class) references public.retention_classes(class_id) on delete restrict;
  end if;
end $$;

-- A record cannot be resolved/deleted under a class that is unresolved or not deletion-eligible.
create or replace function public.enforce_retention_class_policy()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.retention_classes;
begin
  select * into c from public.retention_classes where class_id = NEW.retention_class;
  if NEW.deletion_status in ('candidate','authorized','deleted') and (c.policy_status <> 'resolved' or c.deletion_eligible is not true) then
    raise exception using errcode = '23514', message = 'RETENTION_CLASS_NOT_DELETION_ELIGIBLE';
  end if;
  return NEW;
end;
$$;
revoke all on function public.enforce_retention_class_policy() from public, anon, authenticated;
drop trigger if exists enforce_retention_class_policy on public.retention_records;
create trigger enforce_retention_class_policy before insert or update on public.retention_records
  for each row execute function public.enforce_retention_class_policy();

alter table public.retention_classes enable row level security;
revoke all on public.retention_classes from anon, authenticated;
grant select on public.retention_classes to authenticated;
grant all on public.retention_classes to service_role;
drop policy if exists retention_classes_operator_read on public.retention_classes;
create policy retention_classes_operator_read on public.retention_classes for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator'));

commit;
