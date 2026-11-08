-- P4b: governed RON statutory evidence on the existing RON tables.
-- Additive and forward-only. Extends ron_sessions / ron_signers / ron_documents /
-- ron_audit_events / document_versions / deals. No parallel RON ledger is created.
begin;

-- 1. Session-level statutory evidence + canonical provider/Milano lifecycle.
alter table public.ron_sessions
  add column if not exists ron_lifecycle_state text not null default 'REQUESTED',
  add column if not exists provider_name text not null default 'bluenotary',
  add column if not exists requested_at timestamptz,
  add column if not exists provider_accepted_at timestamptz,
  add column if not exists provider_session_completed_at timestamptz,
  add column if not exists execution_completed_at timestamptz,
  add column if not exists notary_name text,
  add column if not exists notary_provider_reference text,
  add column if not exists notary_commission_number text,
  add column if not exists notary_commission_jurisdiction text,
  add column if not exists notary_commission_expires_on date,
  add column if not exists notary_ron_registration_reference text,
  add column if not exists notarial_act_type text,
  add column if not exists notarial_act_count integer,
  add column if not exists certificate_completion_reference text,
  add column if not exists electronic_signature_reference text,
  add column if not exists electronic_seal_reference text,
  add column if not exists witness_requirement text not null default 'review_required',
  add column if not exists journal_reference text,
  add column if not exists av_recording_reference text,
  add column if not exists provider_evidence_references jsonb not null default '[]'::jsonb,
  -- External provider-controlled fee evidence only. NOT a Milano charge: never priced, quoted,
  -- invoiced, reconciled through Wise, discounted or recognised as Milano revenue. No amount stored.
  add column if not exists provider_fee_evidence_classification text,
  add column if not exists provider_fee_evidence_reference text,
  add column if not exists retention_class text,
  add column if not exists retention_rule text,
  add column if not exists retention_start_at timestamptz,
  add column if not exists retention_until timestamptz,
  add column if not exists qc_status text not null default 'pending',
  add column if not exists qc_review_reference text,
  add column if not exists qc_recorded_at timestamptz,
  add column if not exists qc_recorded_by uuid,
  add column if not exists exception_status text not null default 'none',
  add column if not exists exception_reason text,
  add column if not exists evidence_verified_at timestamptz,
  add column if not exists evidence_verified_by uuid,
  add column if not exists evidence_verification_hash text,
  add column if not exists milano_completed_by uuid;

-- Backfill before lifecycle enforcement exists. Historical sessions never had
-- verified statutory evidence, so they fail closed at EVIDENCE_PENDING at most.
update public.ron_sessions set
  requested_at = coalesce(requested_at, created_at),
  ron_lifecycle_state = case
    when milano_ron_status in ('RON_EXPIRED') then 'FAILED'
    when milano_ron_status in ('RON_COMPLETED','SIGNED_DOCS_RETRIEVED','READY_FOR_APOSTILLE') then 'EVIDENCE_PENDING'
    when milano_ron_status = 'SESSION_PROCESSING' then 'PROVIDER_SESSION_COMPLETED'
    when milano_ron_status = 'NOTARY_ACCEPTED' then 'PROVIDER_ACCEPTED'
    when milano_ron_status in ('SESSION_STARTED','SESSION_JOINED','SESSION_LEFT') then 'STARTED'
    else 'REQUESTED'
  end,
  exception_status = case when milano_ron_status = 'RON_EXPIRED' then 'open' else exception_status end,
  exception_reason = case when milano_ron_status = 'RON_EXPIRED' then coalesce(exception_reason, 'provider_session_expired') else exception_reason end
where ron_lifecycle_state = 'REQUESTED';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_lifecycle_state_check') then
    alter table public.ron_sessions add constraint ron_sessions_lifecycle_state_check check (
      ron_lifecycle_state in ('REQUESTED','STARTED','PROVIDER_ACCEPTED','PROVIDER_SESSION_COMPLETED',
        'EVIDENCE_PENDING','EVIDENCE_VERIFIED','COMPLETED','FAILED','CANCELLED'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_witness_requirement_check') then
    alter table public.ron_sessions add constraint ron_sessions_witness_requirement_check check (
      witness_requirement in ('required','not_required','review_required'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_qc_status_check') then
    alter table public.ron_sessions add constraint ron_sessions_qc_status_check check (
      qc_status in ('pending','passed','failed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_exception_status_check') then
    alter table public.ron_sessions add constraint ron_sessions_exception_status_check check (
      exception_status in ('none','open','resolved'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_provider_fee_evidence_check') then
    alter table public.ron_sessions add constraint ron_sessions_provider_fee_evidence_check check (
      provider_fee_evidence_classification is null
      or provider_fee_evidence_classification = 'EXTERNAL_PROVIDER_NOTARIAL_FEE');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_act_count_check') then
    alter table public.ron_sessions add constraint ron_sessions_act_count_check check (
      notarial_act_count is null or notarial_act_count between 1 and 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_sessions_provider_refs_array_check') then
    alter table public.ron_sessions add constraint ron_sessions_provider_refs_array_check check (
      jsonb_typeof(provider_evidence_references) = 'array');
  end if;
end $$;

-- 2. Signer/witness-level evidence references (results + references only;
-- raw identity documents and KBA answers are never stored here).
alter table public.ron_signers
  add column if not exists party_role text not null default 'principal',
  add column if not exists signer_reference text,
  add column if not exists signer_location_jurisdiction text,
  add column if not exists signer_location_evidence_reference text,
  add column if not exists identity_proofing_result text,
  add column if not exists identity_proofing_reference text,
  add column if not exists credential_analysis_result text,
  add column if not exists credential_analysis_reference text,
  add column if not exists kba_result text,
  add column if not exists kba_reference text,
  add column if not exists awareness_willingness_confirmed_at timestamptz,
  add column if not exists awareness_willingness_reference text,
  add column if not exists oath_administered_at timestamptz,
  add column if not exists oath_reference text,
  add column if not exists witness_appearance text,
  add column if not exists witness_evidence_reference text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ron_signers_party_role_check') then
    alter table public.ron_signers add constraint ron_signers_party_role_check check (
      party_role in ('principal','witness'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_signers_evidence_result_check') then
    alter table public.ron_signers add constraint ron_signers_evidence_result_check check (
      (identity_proofing_result is null or identity_proofing_result in ('passed','failed','not_required'))
      and (credential_analysis_result is null or credential_analysis_result in ('passed','failed','not_required'))
      and (kba_result is null or kba_result in ('passed','failed','not_required')));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_signers_witness_appearance_check') then
    alter table public.ron_signers add constraint ron_signers_witness_appearance_check check (
      witness_appearance is null or witness_appearance in ('remote','physical'));
  end if;
end $$;

-- 3. Executed artifact evidence: exact document/version/hash + custody linkage.
alter table public.ron_documents
  add column if not exists executed_sha256 text,
  add column if not exists executed_document_version_id uuid,
  add column if not exists executed_size_bytes bigint,
  add column if not exists executed_content_type text,
  add column if not exists executed_captured_at timestamptz,
  add column if not exists custody_ledger_hash text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ron_documents_executed_sha256_check') then
    alter table public.ron_documents add constraint ron_documents_executed_sha256_check check (
      executed_sha256 is null or (
        executed_sha256 ~ '^[0-9a-f]{64}$'
        and signed_storage_path like ('%/executed/' || executed_sha256 || '/%')
      ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ron_documents_source_not_executed_check') then
    alter table public.ron_documents add constraint ron_documents_source_not_executed_check check (
      storage_path is null or signed_storage_path is null or storage_path <> signed_storage_path);
  end if;
end $$;

-- 4. Canonical document version truth gains RON lineage and is secured.
alter table public.document_versions
  add column if not exists parent_version_id uuid references public.document_versions(id) on delete restrict,
  add column if not exists source_file_id uuid,
  add column if not exists ron_session_id uuid references public.ron_sessions(id) on delete restrict,
  add column if not exists ron_document_id uuid references public.ron_documents(id) on delete restrict,
  add column if not exists storage_bucket text;

create unique index if not exists document_versions_ron_executed_hash_uidx
  on public.document_versions(ron_session_id, file_hash)
  where stage = 'executed' and ron_session_id is not null;
create index if not exists idx_document_versions_ron_document
  on public.document_versions(ron_document_id) where ron_document_id is not null;
create index if not exists idx_document_versions_parent
  on public.document_versions(parent_version_id) where parent_version_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ron_documents_executed_version_fk') then
    alter table public.ron_documents add constraint ron_documents_executed_version_fk
      foreign key (executed_document_version_id) references public.document_versions(id) on delete restrict;
  end if;
end $$;
create index if not exists idx_ron_documents_executed_version
  on public.ron_documents(executed_document_version_id) where executed_document_version_id is not null;
create index if not exists idx_ron_sessions_lifecycle on public.ron_sessions(ron_lifecycle_state);

alter table public.document_versions enable row level security;
drop policy if exists document_versions_operator_read on public.document_versions;
create policy document_versions_operator_read on public.document_versions
for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in
  ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')
);
drop policy if exists document_versions_service_all on public.document_versions;
create policy document_versions_service_all on public.document_versions
for all to service_role using (true) with check (true);
revoke all on public.document_versions from anon;
revoke insert, update, delete on public.document_versions from authenticated;
grant select on public.document_versions to authenticated;
grant all on public.document_versions to service_role;

create or replace function public.protect_document_version_content()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.stage in ('executed','apostilled','released') then
      raise exception using errcode = '42501', message = 'DOCUMENT_VERSION_EVIDENCE_IMMUTABLE';
    end if;
    return OLD;
  end if;
  if (NEW.matter_id, NEW.stage, NEW.file_hash, NEW.storage_path, NEW.source_file, NEW.version_number,
      NEW.parent_version_id, NEW.ron_session_id, NEW.ron_document_id, NEW.storage_bucket)
     is distinct from
     (OLD.matter_id, OLD.stage, OLD.file_hash, OLD.storage_path, OLD.source_file, OLD.version_number,
      OLD.parent_version_id, OLD.ron_session_id, OLD.ron_document_id, OLD.storage_bucket) then
    raise exception using errcode = '42501', message = 'DOCUMENT_VERSION_CONTENT_IMMUTABLE';
  end if;
  return NEW;
end;
$$;
revoke all on function public.protect_document_version_content() from public, anon, authenticated;
drop trigger if exists protect_document_version_content on public.document_versions;
create trigger protect_document_version_content
  before update or delete on public.document_versions
  for each row execute function public.protect_document_version_content();

-- 5. Lifecycle transition graph (mirrors lib/ron/evidence.ts).
create or replace function public.is_valid_ron_lifecycle_transition(p_from text, p_to text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case
    when p_from = p_to then true
    when p_from in ('COMPLETED','FAILED','CANCELLED') then false
    when p_to in ('FAILED','CANCELLED') then true
    when p_from = 'REQUESTED' then p_to in ('STARTED','PROVIDER_ACCEPTED','PROVIDER_SESSION_COMPLETED')
    when p_from = 'STARTED' then p_to in ('PROVIDER_ACCEPTED','PROVIDER_SESSION_COMPLETED')
    when p_from = 'PROVIDER_ACCEPTED' then p_to in ('STARTED','PROVIDER_SESSION_COMPLETED')
    when p_from = 'PROVIDER_SESSION_COMPLETED' then p_to = 'EVIDENCE_PENDING'
    when p_from = 'EVIDENCE_PENDING' then p_to = 'EVIDENCE_VERIFIED'
    when p_from = 'EVIDENCE_VERIFIED' then p_to in ('EVIDENCE_PENDING','COMPLETED')
    else false end, false);
$$;
revoke all on function public.is_valid_ron_lifecycle_transition(text, text) from public, anon, authenticated;
grant execute on function public.is_valid_ron_lifecycle_transition(text, text) to service_role;

-- 6. Mandatory applicable evidence (mirrors lib/ron/evidence.ts codes).
create or replace function public.ron_session_missing_evidence(s public.ron_sessions)
returns text[] language plpgsql stable security definer set search_path = '' as $$
declare
  missing text[] := '{}';
  truth jsonb;
  act text;
  principal_count integer;
  r record;
  executed_count integer;
begin
  select coalesce(d.execution_truth, '{}'::jsonb) into truth from public.deals d where d.id = s.matter_id;
  if not found then
    missing := missing || 'MATTER_NOT_FOUND'::text;
    truth := '{}'::jsonb;
  end if;
  act := coalesce(nullif(btrim(s.notarial_act_type), ''), truth ->> 'notarial_act');

  if nullif(btrim(s.provider_name), '') is null then missing := missing || 'PROVIDER_NAME'::text; end if;
  if nullif(btrim(s.bn_session_id), '') is null then missing := missing || 'PROVIDER_SESSION_REFERENCE'::text; end if;
  if nullif(btrim(s.notary_name), '') is null then missing := missing || 'NOTARY_IDENTITY'::text; end if;
  if nullif(btrim(s.notary_commission_number), '') is null
     or nullif(btrim(s.notary_commission_jurisdiction), '') is null
     or s.notary_commission_expires_on is null then
    missing := missing || 'NOTARY_COMMISSION'::text;
  elsif s.execution_completed_at is not null and s.notary_commission_expires_on < (s.execution_completed_at at time zone 'UTC')::date then
    missing := missing || 'NOTARY_COMMISSION_EXPIRED'::text;
  end if;
  if act is null or act in ('review_required','unknown') then missing := missing || 'NOTARIAL_ACT_TYPE'::text; end if;
  if s.notarial_act_count is null or s.notarial_act_count < 1 then missing := missing || 'NOTARIAL_ACT_COUNT'::text; end if;
  if nullif(btrim(s.certificate_completion_reference), '') is null then missing := missing || 'CERTIFICATE_COMPLETION'::text; end if;
  if nullif(btrim(s.electronic_signature_reference), '') is null then missing := missing || 'ELECTRONIC_SIGNATURE'::text; end if;
  if nullif(btrim(s.electronic_seal_reference), '') is null then missing := missing || 'ELECTRONIC_SEAL'::text; end if;
  if s.execution_completed_at is null then missing := missing || 'EXECUTION_TIMESTAMP'::text; end if;
  if nullif(btrim(s.journal_reference), '') is null then missing := missing || 'JOURNAL_REFERENCE'::text; end if;
  if nullif(btrim(s.av_recording_reference), '') is null then missing := missing || 'AV_RECORDING_REFERENCE'::text; end if;
  if s.retention_class is null or s.retention_rule is null or s.retention_start_at is null then missing := missing || 'RETENTION_METADATA'::text; end if;
  if jsonb_typeof(s.provider_evidence_references) <> 'array' or jsonb_array_length(s.provider_evidence_references) < 1 then
    missing := missing || 'PROVIDER_EVIDENCE_REFERENCES'::text;
  end if;
  if s.exception_status = 'open' then missing := missing || 'EXCEPTION_OPEN'::text; end if;

  if s.witness_requirement = 'review_required' then
    missing := missing || 'WITNESS_REQUIREMENT_REVIEW'::text;
  elsif s.witness_requirement = 'required' and not exists (
    select 1 from public.ron_signers w where w.ron_session_id = s.id and w.party_role = 'witness'
      and nullif(btrim(w.witness_evidence_reference), '') is not null and w.witness_appearance is not null
  ) then
    missing := missing || 'WITNESS_EVIDENCE'::text;
  end if;

  select count(*) into principal_count from public.ron_signers p where p.ron_session_id = s.id and p.party_role = 'principal';
  if principal_count = 0 then missing := missing || 'SIGNER_REFERENCE'::text; end if;

  for r in select * from public.ron_signers p where p.ron_session_id = s.id and p.party_role = 'principal' loop
    if nullif(btrim(r.signer_reference), '') is null and not ('SIGNER_REFERENCE' = any(missing)) then
      missing := missing || 'SIGNER_REFERENCE'::text; end if;
    if (nullif(btrim(r.signer_location_jurisdiction), '') is null or nullif(btrim(r.signer_location_evidence_reference), '') is null)
       and not ('SIGNER_LOCATION_EVIDENCE' = any(missing)) then
      missing := missing || 'SIGNER_LOCATION_EVIDENCE'::text; end if;
    if (r.identity_proofing_result is distinct from 'passed' or nullif(btrim(r.identity_proofing_reference), '') is null)
       and not ('IDENTITY_PROOFING' = any(missing)) then
      missing := missing || 'IDENTITY_PROOFING'::text; end if;
    if coalesce(truth ->> 'ron_credential_analysis_status', 'required') <> 'not_required'
       and (r.credential_analysis_result is distinct from 'passed' or nullif(btrim(r.credential_analysis_reference), '') is null)
       and not ('CREDENTIAL_ANALYSIS' = any(missing)) then
      missing := missing || 'CREDENTIAL_ANALYSIS'::text; end if;
    if coalesce(truth ->> 'ron_kba_status', 'required') <> 'not_required'
       and (r.kba_result is distinct from 'passed' or nullif(btrim(r.kba_reference), '') is null)
       and not ('KBA' = any(missing)) then
      missing := missing || 'KBA'::text; end if;
    if (r.awareness_willingness_confirmed_at is null or nullif(btrim(r.awareness_willingness_reference), '') is null)
       and not ('AWARENESS_WILLINGNESS' = any(missing)) then
      missing := missing || 'AWARENESS_WILLINGNESS'::text; end if;
    if act in ('jurat','oath_affirmation')
       and (r.oath_administered_at is null or nullif(btrim(r.oath_reference), '') is null)
       and not ('OATH_AFFIRMATION' = any(missing)) then
      missing := missing || 'OATH_AFFIRMATION'::text; end if;
  end loop;

  select count(*) into executed_count from public.ron_documents d
    where d.ron_session_id = s.id and d.executed_sha256 is not null and d.executed_document_version_id is not null;
  if executed_count = 0 then missing := missing || 'EXECUTED_DOCUMENT'::text; end if;
  if exists (select 1 from public.ron_documents d where d.ron_session_id = s.id
             and d.signed_document_received = true and d.executed_sha256 is null) then
    missing := missing || 'EXECUTED_DOCUMENT_HASH'::text; end if;
  if exists (select 1 from public.ron_documents d where d.ron_session_id = s.id
             and d.executed_sha256 is not null and d.custody_ledger_hash is null) then
    missing := missing || 'CUSTODY_LINKAGE'::text; end if;

  return missing;
end;
$$;
revoke all on function public.ron_session_missing_evidence(public.ron_sessions) from public, anon, authenticated;
grant execute on function public.ron_session_missing_evidence(public.ron_sessions) to service_role;

create or replace function public.ron_session_missing_evidence_by_id(p_session_id uuid)
returns text[] language sql stable security definer set search_path = '' as $$
  select public.ron_session_missing_evidence(s) from public.ron_sessions s where s.id = p_session_id;
$$;
revoke all on function public.ron_session_missing_evidence_by_id(uuid) from public, anon, authenticated;
grant execute on function public.ron_session_missing_evidence_by_id(uuid) to service_role;

-- 7. Session lifecycle enforcement: fail closed, frozen evidence, no provider completion authority.
create or replace function public.enforce_ron_session_lifecycle()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  missing text[];
begin
  if TG_OP = 'INSERT' then
    if NEW.ron_lifecycle_state <> 'REQUESTED' then
      raise exception using errcode = '23514', message = 'RON_SESSION_MUST_START_REQUESTED';
    end if;
    if NEW.milano_ron_status = 'RON_COMPLETED' or NEW.completed_at is not null or NEW.evidence_verified_at is not null then
      raise exception using errcode = '23514', message = 'RON_SESSION_CREATION_IS_NOT_COMPLETION';
    end if;
    NEW.requested_at := coalesce(NEW.requested_at, now());
    return NEW;
  end if;

  if NEW.ron_lifecycle_state is distinct from OLD.ron_lifecycle_state
     and not public.is_valid_ron_lifecycle_transition(OLD.ron_lifecycle_state, NEW.ron_lifecycle_state) then
    raise exception using errcode = '23514', message = 'INVALID_RON_LIFECYCLE_TRANSITION';
  end if;

  if OLD.ron_lifecycle_state in ('EVIDENCE_VERIFIED','COMPLETED')
     and not (OLD.ron_lifecycle_state = 'EVIDENCE_VERIFIED' and NEW.ron_lifecycle_state = 'EVIDENCE_PENDING')
     and (NEW.matter_id, NEW.bn_session_id, NEW.provider_name, NEW.execution_completed_at, NEW.notary_name,
          NEW.notary_provider_reference, NEW.notary_commission_number, NEW.notary_commission_jurisdiction,
          NEW.notary_commission_expires_on, NEW.notary_ron_registration_reference, NEW.notarial_act_type,
          NEW.notarial_act_count, NEW.certificate_completion_reference, NEW.electronic_signature_reference,
          NEW.electronic_seal_reference, NEW.witness_requirement, NEW.journal_reference,
          NEW.av_recording_reference, NEW.provider_evidence_references, NEW.provider_fee_evidence_classification,
          NEW.provider_fee_evidence_reference,
          NEW.retention_class, NEW.retention_rule, NEW.retention_start_at, NEW.evidence_verified_at,
          NEW.evidence_verified_by, NEW.evidence_verification_hash)
     is distinct from
         (OLD.matter_id, OLD.bn_session_id, OLD.provider_name, OLD.execution_completed_at, OLD.notary_name,
          OLD.notary_provider_reference, OLD.notary_commission_number, OLD.notary_commission_jurisdiction,
          OLD.notary_commission_expires_on, OLD.notary_ron_registration_reference, OLD.notarial_act_type,
          OLD.notarial_act_count, OLD.certificate_completion_reference, OLD.electronic_signature_reference,
          OLD.electronic_seal_reference, OLD.witness_requirement, OLD.journal_reference,
          OLD.av_recording_reference, OLD.provider_evidence_references, OLD.provider_fee_evidence_classification,
          OLD.provider_fee_evidence_reference,
          OLD.retention_class, OLD.retention_rule, OLD.retention_start_at, OLD.evidence_verified_at,
          OLD.evidence_verified_by, OLD.evidence_verification_hash) then
    raise exception using errcode = '42501', message = 'RON_EVIDENCE_FROZEN';
  end if;

  if OLD.ron_lifecycle_state = 'COMPLETED'
     and (NEW.qc_status, NEW.qc_review_reference, NEW.completed_at, NEW.milano_completed_by)
         is distinct from (OLD.qc_status, OLD.qc_review_reference, OLD.completed_at, OLD.milano_completed_by) then
    raise exception using errcode = '42501', message = 'RON_EVIDENCE_FROZEN';
  end if;

  if NEW.ron_lifecycle_state = 'EVIDENCE_PENDING' and OLD.ron_lifecycle_state = 'EVIDENCE_VERIFIED' then
    NEW.evidence_verified_at := null;
    NEW.evidence_verified_by := null;
    NEW.evidence_verification_hash := null;
  end if;

  if NEW.ron_lifecycle_state in ('EVIDENCE_VERIFIED','COMPLETED')
     and NEW.ron_lifecycle_state is distinct from OLD.ron_lifecycle_state then
    missing := public.ron_session_missing_evidence(NEW);
    if NEW.evidence_verified_at is null or NEW.evidence_verified_by is null or NEW.evidence_verification_hash is null then
      missing := missing || 'OPERATOR_VERIFICATION'::text;
    end if;
    if NEW.ron_lifecycle_state = 'COMPLETED' then
      if NEW.qc_status <> 'passed' or nullif(btrim(NEW.qc_review_reference), '') is null then
        missing := missing || 'QC_EVIDENCE'::text;
      end if;
      if NEW.completed_at is null or NEW.milano_completed_by is null then
        missing := missing || 'MILANO_COMPLETION_ACTOR'::text;
      end if;
    end if;
    if cardinality(missing) > 0 then
      raise exception using errcode = '23514',
        message = 'RON_EVIDENCE_INCOMPLETE',
        detail = array_to_string(missing, ',');
    end if;
  end if;

  if NEW.milano_ron_status = 'RON_COMPLETED' and NEW.milano_ron_status is distinct from OLD.milano_ron_status
     and NEW.ron_lifecycle_state <> 'COMPLETED' then
    raise exception using errcode = '23514', message = 'RON_COMPLETION_REQUIRES_VERIFIED_EVIDENCE';
  end if;

  if NEW.completed_at is distinct from OLD.completed_at and NEW.ron_lifecycle_state <> 'COMPLETED' then
    raise exception using errcode = '23514', message = 'RON_COMPLETION_TIMESTAMP_REQUIRES_COMPLETED';
  end if;

  return NEW;
end;
$$;
revoke all on function public.enforce_ron_session_lifecycle() from public, anon, authenticated;
drop trigger if exists enforce_ron_session_lifecycle on public.ron_sessions;
create trigger enforce_ron_session_lifecycle
  before insert or update on public.ron_sessions
  for each row execute function public.enforce_ron_session_lifecycle();

create or replace function public.protect_ron_session_evidence_delete()
returns trigger language plpgsql set search_path = '' as $$
begin
  if OLD.ron_lifecycle_state not in ('REQUESTED') then
    raise exception using errcode = '42501', message = 'RON_SESSION_EVIDENCE_IMMUTABLE';
  end if;
  return OLD;
end;
$$;
revoke all on function public.protect_ron_session_evidence_delete() from public, anon, authenticated;
drop trigger if exists protect_ron_session_evidence_delete on public.ron_sessions;
create trigger protect_ron_session_evidence_delete
  before delete on public.ron_sessions
  for each row execute function public.protect_ron_session_evidence_delete();

-- 8. Signer evidence freezes with the session.
create or replace function public.protect_ron_signer_evidence()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  state text;
begin
  select s.ron_lifecycle_state into state from public.ron_sessions s
    where s.id = case when TG_OP = 'DELETE' then OLD.ron_session_id else NEW.ron_session_id end;
  if state in ('EVIDENCE_VERIFIED','COMPLETED') then
    if TG_OP = 'DELETE' or TG_OP = 'INSERT' then
      raise exception using errcode = '42501', message = 'RON_EVIDENCE_FROZEN';
    end if;
    if (NEW.party_role, NEW.signer_reference, NEW.signer_location_jurisdiction, NEW.signer_location_evidence_reference,
        NEW.identity_proofing_result, NEW.identity_proofing_reference, NEW.credential_analysis_result,
        NEW.credential_analysis_reference, NEW.kba_result, NEW.kba_reference, NEW.awareness_willingness_confirmed_at,
        NEW.awareness_willingness_reference, NEW.oath_administered_at, NEW.oath_reference, NEW.witness_appearance,
        NEW.witness_evidence_reference, NEW.ron_session_id)
       is distinct from
       (OLD.party_role, OLD.signer_reference, OLD.signer_location_jurisdiction, OLD.signer_location_evidence_reference,
        OLD.identity_proofing_result, OLD.identity_proofing_reference, OLD.credential_analysis_result,
        OLD.credential_analysis_reference, OLD.kba_result, OLD.kba_reference, OLD.awareness_willingness_confirmed_at,
        OLD.awareness_willingness_reference, OLD.oath_administered_at, OLD.oath_reference, OLD.witness_appearance,
        OLD.witness_evidence_reference, OLD.ron_session_id) then
      raise exception using errcode = '42501', message = 'RON_EVIDENCE_FROZEN';
    end if;
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end;
$$;
revoke all on function public.protect_ron_signer_evidence() from public, anon, authenticated;
drop trigger if exists protect_ron_signer_evidence on public.ron_signers;
create trigger protect_ron_signer_evidence
  before insert or update or delete on public.ron_signers
  for each row execute function public.protect_ron_signer_evidence();

-- 9. Executed artifact evidence is immutable once captured.
create or replace function public.protect_ron_executed_document()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.executed_sha256 is not null or OLD.signed_document_received = true then
      raise exception using errcode = '42501', message = 'RON_EXECUTED_EVIDENCE_IMMUTABLE';
    end if;
    return OLD;
  end if;
  if OLD.signed_document_received = true and NEW.signed_document_received is distinct from true then
    raise exception using errcode = '42501', message = 'RON_EXECUTED_EVIDENCE_IMMUTABLE';
  end if;
  if OLD.executed_sha256 is not null and (
       (NEW.executed_sha256, NEW.signed_storage_path, NEW.storage_bucket, NEW.executed_document_version_id,
        NEW.executed_size_bytes, NEW.executed_content_type, NEW.executed_captured_at, NEW.ron_session_id,
        NEW.matter_id, NEW.storage_path, NEW.document_id)
       is distinct from
       (OLD.executed_sha256, OLD.signed_storage_path, OLD.storage_bucket, OLD.executed_document_version_id,
        OLD.executed_size_bytes, OLD.executed_content_type, OLD.executed_captured_at, OLD.ron_session_id,
        OLD.matter_id, OLD.storage_path, OLD.document_id)
       or (OLD.custody_ledger_hash is not null and NEW.custody_ledger_hash is distinct from OLD.custody_ledger_hash)) then
    raise exception using errcode = '42501', message = 'RON_EXECUTED_EVIDENCE_IMMUTABLE';
  end if;
  return NEW;
end;
$$;
revoke all on function public.protect_ron_executed_document() from public, anon, authenticated;
drop trigger if exists protect_ron_executed_document on public.ron_documents;
create trigger protect_ron_executed_document
  before update or delete on public.ron_documents
  for each row execute function public.protect_ron_executed_document();

-- 10. Existing ron_audit_events ledger becomes append-only (corrections append).
create or replace function public.reject_ron_audit_event_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '42501', message = 'RON_AUDIT_EVENTS_APPEND_ONLY';
end;
$$;
revoke all on function public.reject_ron_audit_event_mutation() from public, anon, authenticated;
drop trigger if exists reject_ron_audit_event_mutation on public.ron_audit_events;
create trigger reject_ron_audit_event_mutation
  before update or delete on public.ron_audit_events
  for each row execute function public.reject_ron_audit_event_mutation();
create index if not exists idx_ron_audit_events_session_created
  on public.ron_audit_events(ron_session_id, created_at desc);

-- 11. A RON Matter cannot leave in_execution without authoritative RON completion.
-- Non-RON Matters (execution_truth.execution_method <> 'ron') are unaffected.
create or replace function public.enforce_ron_completion_before_execution_exit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if OLD.status = 'in_execution' and NEW.status is distinct from OLD.status
     and coalesce(NEW.execution_truth ->> 'execution_method', '') = 'ron'
     and not exists (
       select 1 from public.ron_sessions s where s.matter_id = NEW.id and s.ron_lifecycle_state = 'COMPLETED'
     ) then
    raise exception using errcode = '23514', message = 'RON_COMPLETION_REQUIRED_BEFORE_EXECUTION_EXIT';
  end if;
  return NEW;
end;
$$;
revoke all on function public.enforce_ron_completion_before_execution_exit() from public, anon, authenticated;
drop trigger if exists enforce_ron_completion_before_execution_exit on public.deals;
create trigger enforce_ron_completion_before_execution_exit
  before update of status on public.deals
  for each row execute function public.enforce_ron_completion_before_execution_exit();

comment on column public.ron_sessions.ron_lifecycle_state is
  'Canonical RON lifecycle. Provider acceptance/completion are non-authoritative; COMPLETED requires verified statutory evidence, QC and an operator actor.';
comment on column public.ron_sessions.provider_session_completed_at is
  'Provider-reported completion timestamp. Never authoritative Milano completion.';
comment on column public.ron_sessions.provider_fee_evidence_classification is
  'EXTERNAL_PROVIDER_NOTARIAL_FEE: the notarial fee is set and collected by the RON provider outside Milano. Evidence only; not a Milano charge, quote/invoice line, Wise amount, discount input or Milano revenue. Not required for Milano RON completion.';
comment on column public.ron_sessions.retention_rule is
  'FL_RON_10Y when the commissioning jurisdiction is Florida; REVIEW_REQUIRED otherwise until governed retention (P5/P7) resolves it.';

commit;
