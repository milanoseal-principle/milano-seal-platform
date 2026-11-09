-- P21: reconcile existing statutory audit RPCs with canonical P4B lifecycle.
-- Forward only. No provider event or statutory append may create completion truth.
begin;
create or replace function public.append_ron_statutory_evidence(p_session_id uuid,p_actor_id uuid,p_expected_evidence_id uuid,p_idempotency_key uuid,p_evidence jsonb,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.ron_sessions%rowtype; m public.deals%rowtype; prior public.ron_audit_events%rowtype;
 k text; signer jsonb; doc jsonb; documents jsonb; event_id uuid; n integer; required_count integer;
begin
 if not exists(select 1 from auth.users u where u.id=p_actor_id and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true'
 and (u.banned_until is null or u.banned_until<=now()) and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')) then
 raise exception using errcode='42501',message='FORBIDDEN'; end if;
 if p_idempotency_key is null or length(trim(coalesce(p_reason,''))) not between 10 and 500 then raise exception 'EVIDENCE_REASON_REQUIRED'; end if;
 select * into s from public.ron_sessions where id=p_session_id for update;
 if not found then raise exception 'SESSION_NOT_FOUND'; end if;
 select * into prior from public.ron_audit_events where ron_session_id=s.id and idempotency_key=p_idempotency_key;
 if found then
   if prior.metadata->'evidence' is distinct from p_evidence or prior.description is distinct from p_reason then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return jsonb_build_object('evidence_id',prior.id,'duplicate',true);
 end if;
 if s.statutory_evidence_id is distinct from p_expected_evidence_id then raise exception using errcode='40001',message='STALE_EVIDENCE'; end if;
 if s.statutory_evidence_id is not null then
   select * into prior from public.ron_audit_events where id=s.statutory_evidence_id;
   if s.evidence_reopened_at is null and prior.metadata->'evidence'=p_evidence and prior.description=p_reason then return jsonb_build_object('evidence_id',prior.id,'duplicate',true); end if;
   if s.evidence_reopened_at is null then raise exception 'VERIFIED_EVIDENCE_LOCKED_REOPEN_REQUIRED'; end if;
 end if;
 select * into m from public.deals where id=s.matter_id for share;
 if m.execution_truth->>'execution_method' is distinct from 'ron' then raise exception 'NOT_A_RON_MATTER'; end if;
 if s.provider_completed_at is null or s.blue_notary_status is distinct from 'COMPLETED' then raise exception 'PROVIDER_COMPLETION_REQUIRED'; end if;
 if jsonb_typeof(p_evidence) is distinct from 'object' then raise exception 'INVALID_EVIDENCE'; end if;
 if p_evidence - array['provider_reference','provider_evidence_reference','notary_identity_reference','commission_reference','notarial_act','executed_at','certificate_reference','seal_signature_reference','journal_reference','recording_reference','recording_retention_reference','recording_retained_until','custody_reference','qc_reference','signed_document_ids','signers','witnesses','external_provider_fee','commission_jurisdiction','commission_expires_at','act_count','qc_status','witness_applicability'] <> '{}'::jsonb then raise exception 'UNSUPPORTED_EVIDENCE_FIELD'; end if;
 foreach k in array array['provider_reference','provider_evidence_reference','notary_identity_reference','commission_reference','commission_jurisdiction','certificate_reference','seal_signature_reference','journal_reference','recording_reference','recording_retention_reference','custody_reference','qc_reference'] loop
 if not public.p4_evidence_reference(p_evidence->k) then raise exception 'EVIDENCE_REFERENCE_REQUIRED: %',k; end if;
 end loop;
 if p_evidence ? 'external_provider_fee' and ((p_evidence->'external_provider_fee') - array['classification','reference'] <> '{}'::jsonb or p_evidence->'external_provider_fee'->>'classification' is distinct from 'EXTERNAL_PROVIDER_NOTARIAL_FEE' or not public.p4_evidence_reference(p_evidence->'external_provider_fee'->'reference')) then raise exception 'INVALID_EXTERNAL_PROVIDER_FEE_REFERENCE'; end if;
 if not exists(select 1 from public.execution_qa_reviews q where q.id::text=p_evidence->>'qc_reference' and q.deal_id=s.matter_id and q.checklist_type='RON_QA' and ((m.witnesses=0 and q.witness_status='NOT_REQUIRED') or (m.witnesses>0 and q.witness_status='COMPLETE')) and q.execution_qa_status='PASSED' and q.passed_by is not null and q.passed_at is not null and coalesce(cardinality(q.blocking_items),0)=0 and coalesce(cardinality(q.missing_items),0)=0) then raise exception 'GOVERNED_RON_QC_REQUIRED'; end if;
 if exists(select 1 from public.compliance_incidents i where i.matter_id=s.matter_id and i.status not in ('CLOSED','MATTER_RESTORED_OR_CLOSED') and (i.release_frozen or i.severity in ('HIGH','CRITICAL'))) then raise exception 'BLOCKING_EXECUTION_EXCEPTION'; end if;
 if p_evidence->>'qc_status' is distinct from 'PASSED' then raise exception 'QC_PASS_REQUIRED'; end if;
 if (p_evidence->>'act_count')::integer is null or (p_evidence->>'act_count')::integer not between 1 and 1000 then raise exception 'ACT_COUNT_REQUIRED'; end if;
 if (p_evidence->>'commission_expires_at')::timestamptz is null or (p_evidence->>'commission_expires_at')::timestamptz < (p_evidence->>'executed_at')::timestamptz then raise exception 'COMMISSION_EXPIRED_OR_UNKNOWN'; end if;
 if p_evidence->>'provider_reference' is distinct from s.bn_session_id or nullif(s.bn_session_id,'') is null then raise exception 'PROVIDER_REFERENCE_MISMATCH'; end if;
 if nullif(m.execution_truth->>'notary_jurisdiction','') is null or upper(trim(p_evidence->>'commission_jurisdiction')) is distinct from upper(trim(m.execution_truth->>'notary_jurisdiction')) then raise exception 'COMMISSION_JURISDICTION_MISMATCH'; end if;
 if p_evidence->>'notarial_act' is distinct from m.execution_truth->>'notarial_act' or coalesce(p_evidence->>'notarial_act','') not in ('acknowledgment','jurat','oath_affirmation','signature_witnessing','other') then raise exception 'NOTARIAL_ACT_MISMATCH'; end if;
 if (p_evidence->>'executed_at')::timestamptz is null or (p_evidence->>'executed_at')::timestamptz>now()+interval '5 minutes' or (p_evidence->>'recording_retained_until')::timestamptz is null or (p_evidence->>'recording_retained_until')::timestamptz<=(p_evidence->>'executed_at')::timestamptz then raise exception 'INVALID_EXECUTION_RETENTION_TIME'; end if;
 if upper(trim(p_evidence->>'commission_jurisdiction')) in ('FL','FLORIDA','US-FL') and (p_evidence->>'recording_retained_until')::timestamptz < (p_evidence->>'executed_at')::timestamptz + interval '10 years' then raise exception 'FLORIDA_RON_RETENTION_REQUIRED'; end if;
 if jsonb_typeof(p_evidence->'signers') is distinct from 'array' or jsonb_typeof(p_evidence->'signed_document_ids') is distinct from 'array' or jsonb_typeof(p_evidence->'witnesses') is distinct from 'array' then raise exception 'INVALID_EVIDENCE_ROSTER'; end if;
 select count(*) into n from public.ron_signers where ron_session_id=s.id and matter_id=s.matter_id;
 if exists(select 1 from public.ron_signers where ron_session_id=s.id and (identity_status='FAILED' or kba_status='FAILED' or biometric_status='FAILED')) then raise exception 'PROVIDER_IDENTITY_FAILURE'; end if;
 if n=0 or jsonb_array_length(p_evidence->'signers')<>n or (select count(distinct x->>'signer_id') from jsonb_array_elements(p_evidence->'signers') x)<>n then raise exception 'SIGNER_EVIDENCE_INCOMPLETE'; end if;
 for signer in select * from jsonb_array_elements(p_evidence->'signers') loop
 if signer - array['signer_id','location_reference','identity_proofing','credential_analysis','kba','awareness','willingness','oath'] <> '{}'::jsonb then raise exception 'UNSUPPORTED_SIGNER_FIELD'; end if;
 if not exists(select 1 from public.ron_signers where id=(signer->>'signer_id')::uuid and ron_session_id=s.id and matter_id=s.matter_id) or not public.p4_evidence_reference(signer->'location_reference') then raise exception 'SIGNER_MISMATCH'; end if;
 foreach k in array array['identity_proofing','awareness','willingness'] loop
 if not public.p4_evidence_proof(signer->k,true) then raise exception 'SIGNER_PROOF_REQUIRED: %',k; end if;
 end loop;
 foreach k in array array['credential_analysis','kba'] loop
 if not public.p4_evidence_proof(signer->k,true) then
   if not public.p4_evidence_proof(signer->k,false) or s.provider_eligibility_status is distinct from 'ELIGIBLE' or s.capability_verified_at is null
      or (k='kba' and coalesce(m.execution_truth->>'ron_kba_status','required')<>'not_required')
      or (k='credential_analysis' and coalesce(m.execution_truth->>'ron_credential_analysis_status','required')<>'not_required') then raise exception 'IDENTITY_PROOF_REQUIRED: %',k; end if;
 end if;
 end loop;
 if not public.p4_evidence_proof(signer->'oath',p_evidence->>'notarial_act' in ('jurat','oath_affirmation')) then raise exception 'OATH_PROOF_REQUIRED'; end if;
 end loop;
 if jsonb_typeof(p_evidence->'witness_applicability') is distinct from 'object' or (p_evidence->'witness_applicability') - array['status','basis_reference'] <> '{}'::jsonb or not public.p4_evidence_reference(p_evidence->'witness_applicability'->'basis_reference') or p_evidence->'witness_applicability'->>'status' is distinct from (case when m.witnesses>0 then 'REQUIRED' when m.witnesses=0 then 'NOT_REQUIRED' else 'REVIEW_REQUIRED' end) then raise exception 'WITNESS_APPLICABILITY_REVIEW_REQUIRED'; end if;
 if m.witnesses is null then raise exception 'WITNESS_APPLICABILITY_REVIEW_REQUIRED'; end if;
 if jsonb_array_length(p_evidence->'witnesses')<m.witnesses then raise exception 'WITNESS_EVIDENCE_REQUIRED'; end if;
 for signer in select * from jsonb_array_elements(p_evidence->'witnesses') loop
 if signer - array['identity_reference','evidence_reference'] <> '{}'::jsonb or not public.p4_evidence_reference(signer->'identity_reference') or not public.p4_evidence_reference(signer->'evidence_reference') then raise exception 'WITNESS_EVIDENCE_REQUIRED'; end if;
 end loop;
 n:=jsonb_array_length(p_evidence->'signed_document_ids');
 if n=0 or (select count(distinct x#>>'{}') from jsonb_array_elements(p_evidence->'signed_document_ids') x)<>n then raise exception 'EXECUTED_DOCUMENT_REQUIRED'; end if;
 select count(*) into required_count from public.ron_documents where ron_session_id=s.id and uploaded_to_bluenotary=true and signed_document_received=false;
 if n<>required_count or (select count(distinct d.source_ron_document_id) from public.ron_documents d where d.ron_session_id=s.id and d.id in(select (x#>>'{}')::uuid from jsonb_array_elements(p_evidence->'signed_document_ids') x))<>required_count then raise exception 'EXECUTED_DOCUMENT_PACKAGE_INCOMPLETE'; end if;
 select jsonb_agg(jsonb_build_object('id',d.id,'sha256',d.signed_sha256,'storage_bucket',d.storage_bucket,'version',d.executed_version_id,'source_document_id',d.source_ron_document_id,'source_sha256',d.source_sha256)) into documents
 from public.ron_documents d where d.id in(select (x#>>'{}')::uuid from jsonb_array_elements(p_evidence->'signed_document_ids') x)
 and d.ron_session_id=s.id and d.matter_id=s.matter_id and d.signed_document_received=true and d.signed_sha256 ~ '^[a-f0-9]{64}$' and d.storage_bucket='documents'
 and d.source_ron_document_id is not null and d.source_sha256 is not null and d.executed_version_id is not null
 and exists(select 1 from public.document_versions v where v.id=d.executed_version_id and v.matter_id=d.matter_id and v.file_hash=d.signed_sha256 and v.stage='executed')
 and d.signed_storage_path like 'ron/'||s.matter_id::text||'/'||s.id::text||'/executed/'||d.signed_sha256||'/%';
 if coalesce(jsonb_array_length(documents),0)<>n then raise exception 'EXECUTED_DOCUMENT_INTEGRITY_REQUIRED'; end if;
 insert into public.ron_audit_events(matter_id,ron_session_id,event_type,description,actor_id,actor_role,source,metadata,idempotency_key,supersedes_event_id)
 values(s.matter_id,s.id,'RON_STATUTORY_EVIDENCE_VERIFIED',p_reason,p_actor_id,'operator','governed_ron_evidence',
 jsonb_build_object('evidence',p_evidence,'executed_documents',documents,'verified_at',now(),'verified_by',p_actor_id),p_idempotency_key,s.statutory_evidence_id) returning id into event_id;
 update public.ron_sessions set statutory_evidence_id=event_id,evidence_reopened_at=null where id=s.id;
 return jsonb_build_object('evidence_id',event_id,'duplicate',false);
end $$;

create or replace function public.reopen_ron_statutory_evidence(p_session_id uuid,p_actor_id uuid,p_expected_evidence_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.ron_sessions%rowtype; event_id uuid;
begin
 if not exists(select 1 from auth.users u where u.id=p_actor_id and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true'
 and (u.banned_until is null or u.banned_until<=now()) and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')) then raise exception using errcode='42501',message='FORBIDDEN'; end if;
 if length(trim(coalesce(p_reason,''))) not between 10 and 500 then raise exception 'REOPEN_REASON_REQUIRED'; end if;
 select * into s from public.ron_sessions where id=p_session_id for update;
 if not found or s.statutory_evidence_id is null or s.statutory_evidence_id is distinct from p_expected_evidence_id then raise exception using errcode='40001',message='STALE_EVIDENCE'; end if;
 if s.evidence_reopened_at is not null then return jsonb_build_object('evidence_id',s.statutory_evidence_id,'duplicate',true); end if;
 insert into public.ron_audit_events(matter_id,ron_session_id,event_type,description,actor_id,actor_role,source,metadata,supersedes_event_id)
 values(s.matter_id,s.id,'RON_STATUTORY_EVIDENCE_REOPENED',p_reason,p_actor_id,'operator','governed_ron_evidence',jsonb_build_object('previous_evidence_id',s.statutory_evidence_id),s.statutory_evidence_id) returning id into event_id;
 update public.ron_sessions set evidence_reopened_at=now(),milano_ron_status='RON_REVIEW_REQUIRED' where id=s.id;
 return jsonb_build_object('evidence_id',s.statutory_evidence_id,'reopen_event_id',event_id,'duplicate',false);
end $$;
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

  -- A provider artifact reference alone cannot establish canonical version lineage.
  if exists (
    select 1 from public.ron_documents d
    left join public.document_versions v on v.id=d.executed_document_version_id
    where d.ron_session_id=s.id and d.executed_sha256 is not null
      and (d.matter_id is distinct from s.matter_id or v.id is null
           or v.matter_id is distinct from s.matter_id or v.file_hash is distinct from d.executed_sha256
           or v.stage is distinct from 'executed' or v.superseded_by is not null)
  ) then missing := missing || 'EXECUTED_DOCUMENT_LINEAGE'::text; end if;
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


revoke all on function public.append_ron_statutory_evidence(uuid,uuid,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.append_ron_statutory_evidence(uuid,uuid,uuid,uuid,jsonb,text) to service_role;
revoke all on function public.reopen_ron_statutory_evidence(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reopen_ron_statutory_evidence(uuid,uuid,uuid,text) to service_role;
commit;
