-- P5: RON retention evidence, RON security incidents, governed RON records requests.
-- Additive and forward-only. Extends compliance_incidents / incident_audit_log; adds the
-- canonical retention evidence registry that P7 generalises (no second retention system).
begin;

-- A. Retention evidence registry --------------------------------------------------------
create table if not exists public.retention_records (
  id uuid primary key default gen_random_uuid(),
  retention_class text not null,
  record_type text not null,
  record_reference text not null,
  matter_id uuid not null references public.deals(id) on delete restrict,
  ron_session_id uuid references public.ron_sessions(id) on delete restrict,
  retention_start_event text not null,
  retention_start_at timestamptz,
  retention_rule text not null,
  retention_until timestamptz,
  policy_status text not null default 'review_required' check (policy_status in ('resolved','review_required')),
  deletion_status text not null default 'retained' check (deletion_status in ('retained','candidate','authorized','deleted','failed')),
  deletion_authorized_by uuid,
  deletion_authorized_at timestamptz,
  deleted_by uuid,
  deleted_at timestamptz,
  deletion_reason text,
  deletion_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retention_class, record_type, record_reference),
  check (policy_status <> 'resolved' or (retention_start_at is not null and retention_until is not null))
);
create index if not exists idx_retention_records_matter on public.retention_records(matter_id);
create index if not exists idx_retention_records_session on public.retention_records(ron_session_id) where ron_session_id is not null;
create index if not exists idx_retention_records_until on public.retention_records(retention_until) where deletion_status = 'retained';

create table if not exists public.retention_holds (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  ron_session_id uuid references public.ron_sessions(id) on delete restrict,
  retention_record_id uuid references public.retention_records(id) on delete restrict,
  hold_type text not null check (hold_type in ('legal','policy','incident','records_request')),
  reason text not null check (length(btrim(reason)) > 0),
  placed_by uuid not null,
  placed_at timestamptz not null default now(),
  released_by uuid,
  released_at timestamptz,
  release_reason text,
  check ((released_at is null) = (released_by is null)),
  check (released_at is null or length(btrim(coalesce(release_reason, ''))) > 0)
);
create index if not exists idx_retention_holds_matter_active on public.retention_holds(matter_id) where released_at is null;
create index if not exists idx_retention_holds_record on public.retention_holds(retention_record_id) where retention_record_id is not null;
create index if not exists idx_retention_holds_session on public.retention_holds(ron_session_id) where ron_session_id is not null;

create table if not exists public.retention_deletion_events (
  id uuid primary key default gen_random_uuid(),
  retention_record_id uuid not null references public.retention_records(id) on delete restrict,
  stage text not null check (stage in ('candidate','authorized','denied','deleted','failed')),
  actor_id uuid,
  actor_role text,
  reason text,
  blockers text[] not null default '{}',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_retention_deletion_events_record on public.retention_deletion_events(retention_record_id, created_at);

create or replace function public.retention_deletion_blockers(p_record_id uuid)
returns text[] language plpgsql stable security definer set search_path = '' as $$
declare
  r public.retention_records;
  blockers text[] := '{}';
  session_state text;
begin
  select * into r from public.retention_records where id = p_record_id;
  if not found then return array['RECORD_NOT_FOUND']; end if;
  if r.deletion_status = 'deleted' then blockers := blockers || 'ALREADY_DELETED'::text; end if;
  if r.policy_status <> 'resolved' then blockers := blockers || 'RETENTION_POLICY_UNRESOLVED'::text; end if;
  if r.retention_until is null or r.retention_until > now() then blockers := blockers || 'RETENTION_ACTIVE'::text; end if;
  if exists (
    select 1 from public.retention_holds h where h.released_at is null and (
      h.retention_record_id = r.id or (h.retention_record_id is null and h.ron_session_id is not distinct from r.ron_session_id and h.ron_session_id is not null)
      or (h.retention_record_id is null and h.ron_session_id is null and h.matter_id = r.matter_id))
  ) then blockers := blockers || 'HOLD_ACTIVE'::text; end if;
  if r.ron_session_id is not null then
    select s.ron_lifecycle_state into session_state from public.ron_sessions s where s.id = r.ron_session_id;
    if session_state is null or session_state not in ('COMPLETED','FAILED','CANCELLED') then
      blockers := blockers || 'EVIDENCE_DEPENDENCY_ACTIVE'::text;
    end if;
    if exists (select 1 from public.ron_records_requests q where q.ron_session_id = r.ron_session_id
               and q.decision = 'pending' or (q.ron_session_id = r.ron_session_id and q.decision = 'approved' and q.released_at is null)) then
      blockers := blockers || 'RECORDS_REQUEST_OPEN'::text;
    end if;
  end if;
  if exists (select 1 from public.compliance_incidents i where i.matter_id = r.matter_id
             and i.status not in ('CLOSED','RESOLVED','MATTER_RESTORED_OR_CLOSED')) then
    blockers := blockers || 'INCIDENT_OPEN'::text;
  end if;
  return blockers;
end;
$$;

create or replace function public.enforce_retention_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  blockers text[];
begin
  if TG_OP = 'DELETE' then
    raise exception using errcode = '42501', message = 'RETENTION_EVIDENCE_IMMUTABLE';
  end if;
  if TG_OP = 'UPDATE' then
    if OLD.deletion_status = 'deleted' then
      raise exception using errcode = '42501', message = 'RETENTION_EVIDENCE_IMMUTABLE';
    end if;
    if OLD.policy_status = 'resolved' and (NEW.retention_class, NEW.record_type, NEW.record_reference, NEW.matter_id,
        NEW.ron_session_id, NEW.retention_start_event, NEW.retention_start_at, NEW.retention_rule, NEW.retention_until, NEW.policy_status)
        is distinct from (OLD.retention_class, OLD.record_type, OLD.record_reference, OLD.matter_id,
        OLD.ron_session_id, OLD.retention_start_event, OLD.retention_start_at, OLD.retention_rule, OLD.retention_until, OLD.policy_status) then
      raise exception using errcode = '42501', message = 'RESOLVED_RETENTION_POLICY_IMMUTABLE';
    end if;
    if NEW.deletion_status in ('authorized','deleted') and NEW.deletion_status is distinct from OLD.deletion_status then
      blockers := public.retention_deletion_blockers(NEW.id);
      blockers := array_remove(blockers, 'ALREADY_DELETED');
      if NEW.deletion_status = 'authorized' and (NEW.deletion_authorized_by is null or NEW.deletion_authorized_at is null
          or nullif(btrim(NEW.deletion_reason), '') is null) then
        blockers := blockers || 'DELETION_AUTHORIZATION_MISSING'::text;
      end if;
      if NEW.deletion_status = 'deleted' and (OLD.deletion_status <> 'authorized' or NEW.deleted_by is null
          or NEW.deleted_at is null or NEW.deletion_result is null) then
        blockers := blockers || 'DELETION_AUTHORIZATION_MISSING'::text;
      end if;
      if cardinality(blockers) > 0 then
        raise exception using errcode = '23514', message = 'RETENTION_DELETION_BLOCKED', detail = array_to_string(blockers, ',');
      end if;
    end if;
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;
drop trigger if exists enforce_retention_record on public.retention_records;
create trigger enforce_retention_record before update or delete on public.retention_records
  for each row execute function public.enforce_retention_record();

create or replace function public.reject_append_only_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '42501', message = 'APPEND_ONLY_' || upper(TG_TABLE_NAME);
end;
$$;
drop trigger if exists append_only_retention_deletion_events on public.retention_deletion_events;
create trigger append_only_retention_deletion_events before update or delete on public.retention_deletion_events
  for each row execute function public.reject_append_only_mutation();

create or replace function public.protect_retention_hold()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then raise exception using errcode = '42501', message = 'RETENTION_HOLD_IMMUTABLE'; end if;
  if OLD.released_at is not null
     or (NEW.matter_id, NEW.ron_session_id, NEW.retention_record_id, NEW.hold_type, NEW.reason, NEW.placed_by, NEW.placed_at)
        is distinct from (OLD.matter_id, OLD.ron_session_id, OLD.retention_record_id, OLD.hold_type, OLD.reason, OLD.placed_by, OLD.placed_at) then
    raise exception using errcode = '42501', message = 'RETENTION_HOLD_IMMUTABLE';
  end if;
  return NEW;
end;
$$;
drop trigger if exists protect_retention_hold on public.retention_holds;
create trigger protect_retention_hold before update or delete on public.retention_holds
  for each row execute function public.protect_retention_hold();

-- RON evidence enters retention when Milano verifies it. Closing a Matter never deletes it.
create or replace function public.register_ron_retention_records()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  resolved boolean := NEW.retention_rule = 'FL_RON_10Y' and NEW.retention_until is not null;
begin
  if NEW.ron_lifecycle_state = 'EVIDENCE_VERIFIED' and OLD.ron_lifecycle_state is distinct from 'EVIDENCE_VERIFIED' then
    insert into public.retention_records (retention_class, record_type, record_reference, matter_id, ron_session_id,
      retention_start_event, retention_start_at, retention_rule, retention_until, policy_status)
    select 'RON_STATUTORY_EVIDENCE', t.record_type, t.reference, NEW.matter_id, NEW.id,
      'RON_EXECUTION_COMPLETED', NEW.retention_start_at, NEW.retention_rule,
      case when resolved then NEW.retention_until end, case when resolved then 'resolved' else 'review_required' end
    from (values
      ('RON_JOURNAL', NEW.journal_reference),
      ('RON_AV_RECORDING', NEW.av_recording_reference),
      ('RON_SESSION_EVIDENCE', 'ron_sessions:' || NEW.id::text)
    ) as t(record_type, reference)
    where t.reference is not null
    on conflict (retention_class, record_type, record_reference) do nothing;

    insert into public.retention_records (retention_class, record_type, record_reference, matter_id, ron_session_id,
      retention_start_event, retention_start_at, retention_rule, retention_until, policy_status)
    select 'RON_STATUTORY_EVIDENCE', 'RON_EXECUTED_DOCUMENT', 'storage:documents/' || d.signed_storage_path, NEW.matter_id, NEW.id,
      'RON_EXECUTION_COMPLETED', NEW.retention_start_at, NEW.retention_rule,
      case when resolved then NEW.retention_until end, case when resolved then 'resolved' else 'review_required' end
    from public.ron_documents d where d.ron_session_id = NEW.id and d.executed_sha256 is not null
    on conflict (retention_class, record_type, record_reference) do nothing;
  end if;
  return NEW;
end;
$$;
drop trigger if exists register_ron_retention_records on public.ron_sessions;
create trigger register_ron_retention_records after update of ron_lifecycle_state on public.ron_sessions
  for each row execute function public.register_ron_retention_records();

-- B. RON security incidents extend compliance_incidents ----------------------------------
alter table public.compliance_incidents
  add column if not exists incident_category text,
  add column if not exists ron_session_id uuid references public.ron_sessions(id) on delete restrict,
  add column if not exists detected_at timestamptz,
  add column if not exists reported_at timestamptz,
  add column if not exists containment_action text,
  add column if not exists responsible_operator uuid,
  add column if not exists law_enforcement_notification text not null default 'review_required',
  add column if not exists law_enforcement_notified_at timestamptz,
  add column if not exists law_enforcement_evidence_ref text,
  add column if not exists state_notification text not null default 'review_required',
  add column if not exists state_notified_at timestamptz,
  add column if not exists state_notification_evidence_ref text,
  add column if not exists notification_deadline_at timestamptz,
  add column if not exists remediation text,
  add column if not exists credential_replacement_evidence_ref text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'compliance_incidents_ron_category_check') then
    alter table public.compliance_incidents add constraint compliance_incidents_ron_category_check check (
      incident_category is null or incident_category in ('ELECTRONIC_SEAL_COMPROMISE','ELECTRONIC_SIGNATURE_COMPROMISE',
        'RON_CREDENTIAL_COMPROMISE','JOURNAL_COMPROMISE','RECORDING_COMPROMISE','PROVIDER_CREDENTIAL_COMPROMISE',
        'UNAUTHORIZED_ACCESS','EVIDENCE_LOSS_OR_CORRUPTION'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'compliance_incidents_notification_state_check') then
    alter table public.compliance_incidents add constraint compliance_incidents_notification_state_check check (
      law_enforcement_notification in ('required','not_required','review_required','completed')
      and state_notification in ('required','not_required','review_required','completed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'compliance_incidents_notification_evidence_check') then
    alter table public.compliance_incidents add constraint compliance_incidents_notification_evidence_check check (
      (law_enforcement_notification <> 'completed' or (law_enforcement_notified_at is not null and nullif(btrim(law_enforcement_evidence_ref), '') is not null))
      and (state_notification <> 'completed' or (state_notified_at is not null and nullif(btrim(state_notification_evidence_ref), '') is not null)));
  end if;
end $$;
create index if not exists idx_compliance_incidents_matter on public.compliance_incidents(matter_id) where matter_id is not null;
create index if not exists idx_compliance_incidents_ron_session on public.compliance_incidents(ron_session_id) where ron_session_id is not null;

-- 7-day governed target applies only when Florida Department of State notification is marked required.
create or replace function public.enforce_ron_incident()
returns trigger language plpgsql set search_path = '' as $$
begin
  if NEW.incident_category is not null then
    NEW.detected_at := coalesce(NEW.detected_at, NEW.discovered_at, now());
    if NEW.state_notification in ('required','completed') and NEW.notification_deadline_at is null then
      NEW.notification_deadline_at := NEW.detected_at + interval '7 days';
    end if;
    if NEW.status in ('CLOSED','MATTER_RESTORED_OR_CLOSED') and (TG_OP = 'INSERT' or OLD.status is distinct from NEW.status) then
      if NEW.law_enforcement_notification in ('required','review_required') or NEW.state_notification in ('required','review_required') then
        raise exception using errcode = '23514', message = 'RON_INCIDENT_NOTIFICATION_UNRESOLVED';
      end if;
      if nullif(btrim(NEW.containment_action), '') is null or nullif(btrim(NEW.remediation), '') is null
         or NEW.closed_by is null or NEW.closed_at is null then
        raise exception using errcode = '23514', message = 'RON_INCIDENT_CLOSURE_EVIDENCE_MISSING';
      end if;
      if NEW.incident_category in ('ELECTRONIC_SEAL_COMPROMISE','ELECTRONIC_SIGNATURE_COMPROMISE','RON_CREDENTIAL_COMPROMISE','PROVIDER_CREDENTIAL_COMPROMISE')
         and nullif(btrim(NEW.credential_replacement_evidence_ref), '') is null then
        raise exception using errcode = '23514', message = 'RON_INCIDENT_CREDENTIAL_REPLACEMENT_EVIDENCE_MISSING';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists enforce_ron_incident on public.compliance_incidents;
create trigger enforce_ron_incident before insert or update on public.compliance_incidents
  for each row execute function public.enforce_ron_incident();

drop trigger if exists append_only_incident_audit_log on public.incident_audit_log;
create trigger append_only_incident_audit_log before update or delete on public.incident_audit_log
  for each row execute function public.reject_append_only_mutation();

-- C. Governed RON records requests -----------------------------------------------------------
create table if not exists public.ron_records_requests (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  ron_session_id uuid not null references public.ron_sessions(id) on delete restrict,
  requester_name text not null,
  requester_email text,
  requester_user_id uuid,
  requester_verification_state text not null default 'unverified' check (requester_verification_state in ('unverified','verified','failed')),
  requester_verification_evidence_ref text,
  record_category text not null check (record_category in ('JOURNAL_ENTRY','AV_RECORDING','EXECUTED_DOCUMENT','SESSION_EVIDENCE')),
  request_basis text not null check (length(btrim(request_basis)) > 0),
  received_at timestamptz not null default now(),
  due_at timestamptz,
  review_status text not null default 'received' check (review_status in ('received','in_review','decided','released','closed')),
  decision text not null default 'pending' check (decision in ('pending','approved','denied')),
  decision_reason text,
  decided_by uuid,
  decided_at timestamptz,
  redaction_status text not null default 'review_required' check (redaction_status in ('review_required','not_required','required','completed')),
  release_document_version_id uuid references public.document_versions(id) on delete restrict,
  release_sha256 text check (release_sha256 is null or release_sha256 ~ '^[0-9a-f]{64}$'),
  release_custody_hash text,
  released_at timestamptz,
  released_by uuid,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (decision = 'pending' or (decided_by is not null and decided_at is not null and nullif(btrim(decision_reason), '') is not null)),
  check (released_at is null or (decision = 'approved' and requester_verification_state = 'verified'
    and redaction_status in ('not_required','completed') and release_document_version_id is not null
    and release_sha256 is not null and released_by is not null))
);
create index if not exists idx_ron_records_requests_matter on public.ron_records_requests(matter_id);
create index if not exists idx_ron_records_requests_session on public.ron_records_requests(ron_session_id);
create index if not exists idx_ron_records_requests_open on public.ron_records_requests(received_at) where review_status <> 'closed';

create table if not exists public.ron_records_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.ron_records_requests(id) on delete restrict,
  matter_id uuid not null references public.deals(id) on delete restrict,
  event_type text not null,
  actor_id uuid,
  actor_role text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_ron_records_request_events_request on public.ron_records_request_events(request_id, created_at);
drop trigger if exists append_only_ron_records_request_events on public.ron_records_request_events;
create trigger append_only_ron_records_request_events before update or delete on public.ron_records_request_events
  for each row execute function public.reject_append_only_mutation();

create or replace function public.enforce_ron_records_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then raise exception using errcode = '42501', message = 'RON_RECORDS_REQUEST_IMMUTABLE'; end if;
  if not exists (select 1 from public.ron_sessions s where s.id = NEW.ron_session_id and s.matter_id = NEW.matter_id) then
    raise exception using errcode = '23514', message = 'RON_RECORDS_REQUEST_CROSS_MATTER';
  end if;
  if NEW.release_document_version_id is not null and not exists (
    select 1 from public.document_versions v where v.id = NEW.release_document_version_id
      and v.matter_id = NEW.matter_id and v.file_hash = NEW.release_sha256) then
    raise exception using errcode = '23514', message = 'RON_RECORDS_RELEASE_VERSION_MISMATCH';
  end if;
  if TG_OP = 'UPDATE' then
    if OLD.released_at is not null and (NEW.release_document_version_id, NEW.release_sha256, NEW.released_at, NEW.released_by, NEW.decision)
       is distinct from (OLD.release_document_version_id, OLD.release_sha256, OLD.released_at, OLD.released_by, OLD.decision) then
      raise exception using errcode = '42501', message = 'RON_RECORDS_RELEASE_IMMUTABLE';
    end if;
    if (NEW.matter_id, NEW.ron_session_id) is distinct from (OLD.matter_id, OLD.ron_session_id) then
      raise exception using errcode = '42501', message = 'RON_RECORDS_REQUEST_CROSS_MATTER';
    end if;
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;
drop trigger if exists enforce_ron_records_request on public.ron_records_requests;
create trigger enforce_ron_records_request before insert or update or delete on public.ron_records_requests
  for each row execute function public.enforce_ron_records_request();

-- D. Access: service role writes; operators read. No anon/client access, no public lookup.
do $$
declare t text;
begin
  foreach t in array array['retention_records','retention_holds','retention_deletion_events','ron_records_requests','ron_records_request_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists %I on public.%I', t || '_operator_read', t);
    execute format($p$create policy %I on public.%I for select to authenticated using (
      (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator'))$p$,
      t || '_operator_read', t);
  end loop;
end $$;

revoke all on function public.retention_deletion_blockers(uuid) from public, anon, authenticated;
grant execute on function public.retention_deletion_blockers(uuid) to service_role;
revoke all on function public.enforce_retention_record() from public, anon, authenticated;
revoke all on function public.reject_append_only_mutation() from public, anon, authenticated;
revoke all on function public.protect_retention_hold() from public, anon, authenticated;
revoke all on function public.register_ron_retention_records() from public, anon, authenticated;
revoke all on function public.enforce_ron_incident() from public, anon, authenticated;
revoke all on function public.enforce_ron_records_request() from public, anon, authenticated;

commit;
