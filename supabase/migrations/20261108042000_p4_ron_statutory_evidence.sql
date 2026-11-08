begin;
-- Extend the existing RON records; ron_audit_events remains the evidence ledger.
alter table public.ron_sessions add column if not exists statutory_evidence_id uuid references public.ron_audit_events(id) on delete restrict;
alter table public.ron_sessions add column if not exists provider_completed_at timestamptz;
alter table public.ron_sessions add column if not exists evidence_reopened_at timestamptz;
alter table public.ron_documents add column if not exists signed_sha256 text check (signed_sha256 ~ '^[a-f0-9]{64}$');
alter table public.ron_audit_events add column if not exists idempotency_key uuid;
alter table public.ron_audit_events add column if not exists supersedes_event_id uuid references public.ron_audit_events(id) on delete restrict;
alter table public.ron_documents add column if not exists source_ron_document_id uuid references public.ron_documents(id) on delete restrict;
alter table public.ron_documents add column if not exists submitted_storage_path text;
alter table public.ron_documents add column if not exists submitted_sha256 text check (submitted_sha256 ~ '^[a-f0-9]{64}$');
alter table public.ron_documents add column if not exists source_version_id uuid references public.document_versions(id) on delete restrict;
alter table public.ron_documents add column if not exists source_sha256 text check (source_sha256 ~ '^[a-f0-9]{64}$');
alter table public.ron_documents add column if not exists executed_version_id uuid references public.document_versions(id) on delete restrict;
create unique index if not exists ron_statutory_evidence_retry on public.ron_audit_events(ron_session_id,idempotency_key);

create or replace function public.capture_ron_executed_document(p_session_id uuid,p_source_id uuid,p_source_sha256 text,p_sha256 text,p_name text,p_storage_path text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.ron_sessions%rowtype; source public.ron_documents%rowtype; prior public.ron_documents%rowtype; version_id uuid; source_version uuid; document_id uuid;
begin
 select * into s from public.ron_sessions where id=p_session_id for update;
 if not found then raise exception 'SESSION_NOT_FOUND'; end if;
 select * into source from public.ron_documents where id=p_source_id and ron_session_id=s.id and matter_id=s.matter_id and uploaded_to_bluenotary=true and signed_sha256 is null;
 if not found then raise exception 'SOURCE_VERSION_REVIEW_REQUIRED'; end if;
 if source.submitted_sha256 is null or source.submitted_sha256 is distinct from p_source_sha256 or source.submitted_storage_path is null or source.submitted_storage_path not like 'ron/'||s.matter_id::text||'/'||s.id::text||'/source/'||p_source_sha256||'/%' then raise exception 'SUBMITTED_SOURCE_HASH_REQUIRED'; end if;
 if p_sha256 !~ '^[a-f0-9]{64}$' or p_source_sha256 !~ '^[a-f0-9]{64}$' or p_storage_path not like 'ron/'||s.matter_id::text||'/'||s.id::text||'/executed/'||p_sha256||'/%' then raise exception 'INVALID_EXECUTED_VERSION'; end if;
 select * into prior from public.ron_documents where ron_session_id=s.id and source_ron_document_id=source.id and signed_sha256=p_sha256;
 if found then
   if prior.source_sha256 is distinct from p_source_sha256 or prior.signed_storage_path is distinct from p_storage_path then raise exception 'SOURCE_VERSION_CONFLICT'; end if;
   return prior.id;
 end if;
 select d.source_version_id into source_version from public.ron_documents d where d.ron_session_id=s.id and d.source_ron_document_id=source.id and d.source_sha256=p_source_sha256 limit 1;
 if source_version is null then
 insert into public.document_versions(matter_id,stage,file_hash,actor,source_file,notes) values(s.matter_id,'ron_ready',p_source_sha256,'ron_document_ingestion',source.submitted_storage_path,'Exact source bytes submitted to provider') returning id into source_version;
 end if;
 insert into public.document_versions(matter_id,stage,file_hash,actor,source_file,notes)
 values(s.matter_id,'executed',p_sha256,'bluenotary',p_storage_path,'Source RON document '||source.id::text||'; source SHA256 '||p_source_sha256) returning id into version_id;
 insert into public.ron_documents(ron_session_id,matter_id,document_name,blue_notary_document_name,storage_bucket,signed_storage_path,signed_document_received,signed_sha256,document_status,source_ron_document_id,source_sha256,executed_version_id,source_version_id)
 values(s.id,s.matter_id,p_sha256||'-'||p_name,p_name,'documents',p_storage_path,true,p_sha256,'SIGNED',source.id,p_source_sha256,version_id,source_version) returning id into document_id;
 insert into public.ron_audit_events(matter_id,ron_session_id,event_type,description,actor_role,source,metadata)
 values(s.matter_id,s.id,'RON_EXECUTED_DOCUMENT_CAPTURED','Executed version secured; provider retrieval does not verify completion.','system','ron_document_ingestion',jsonb_build_object('document_id',document_id,'source_document_id',source.id,'source_sha256',p_source_sha256,'source_version_id',source_version,'document_version_id',version_id,'sha256',p_sha256,'storage_bucket','documents','storage_path',p_storage_path,'immutable',true));
 if exists(select 1 from public.ron_documents d where d.ron_session_id=s.id and d.source_ron_document_id=source.id and d.signed_sha256<>p_sha256) then
   insert into public.compliance_incidents(deal_id,incident_type,severity,status,title,description,freeze_triggered,discovered_by)
   values(s.matter_id,'RON_EXECUTED_BYTES_CHANGED','critical','OPEN','Provider returned different executed document bytes','Review preserved immutable versions for RON session '||s.id::text||' and source '||source.id::text,true,'ron_document_ingestion');
   update public.ron_sessions set milano_ron_status='RON_REVIEW_REQUIRED' where id=s.id;
 end if;
 return document_id;
end $$;
revoke all on function public.capture_ron_executed_document(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.capture_ron_executed_document(uuid,uuid,text,text,text,text) to service_role;

create or replace function public.p4_evidence_reference(v jsonb) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(v)='string' and length(v#>>'{}') between 1 and 200 and (v#>>'{}') ~ '^[A-Za-z0-9][A-Za-z0-9:_/.-]*$',false)
$$;
create or replace function public.p4_evidence_proof(v jsonb, required boolean) returns boolean language sql immutable set search_path='' as $$
 select case when jsonb_typeof(v)<>'object' then false
 when v->>'status'='VERIFIED' then public.p4_evidence_reference(v->'reference') and v - 'status' - 'reference'='{}'::jsonb
 when v->>'status'='NOT_REQUIRED' and not required then public.p4_evidence_reference(v->'basis_reference') and v - 'status' - 'basis_reference'='{}'::jsonb else false end
$$;

create or replace function public.ron_statutory_evidence_verified(p_session uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ron_sessions s join public.deals m on m.id=s.matter_id join public.ron_audit_events e on e.id=s.statutory_evidence_id
 where s.id=p_session and s.evidence_reopened_at is null and e.ron_session_id=s.id and e.matter_id=s.matter_id and e.event_type='RON_STATUTORY_EVIDENCE_VERIFIED'
 and exists(select 1 from public.execution_qa_reviews q where q.id::text=e.metadata->'evidence'->>'qc_reference' and q.deal_id=s.matter_id and q.execution_qa_status='PASSED' and q.passed_at is not null and q.passed_by is not null and coalesce(cardinality(q.blocking_items),0)=0 and coalesce(cardinality(q.missing_items),0)=0)
 and not exists(select 1 from public.compliance_incidents i where i.deal_id=s.matter_id and i.status not in ('RESOLVED','CLOSED') and (i.freeze_triggered or i.severity in ('high','critical')))
 and m.witnesses is not null and jsonb_array_length(e.metadata->'evidence'->'witnesses')>=m.witnesses
 and m.execution_truth->>'execution_method'='ron' and m.execution_truth->>'notarial_act'=e.metadata->'evidence'->>'notarial_act'
 and not exists(select 1 from public.ron_signers failed where failed.ron_session_id=s.id and (failed.identity_status='FAILED' or failed.kba_status='FAILED' or failed.biometric_status='FAILED'))
 and (select count(*) from public.ron_signers roster where roster.ron_session_id=s.id and roster.matter_id=s.matter_id)=jsonb_array_length(e.metadata->'evidence'->'signers')
 and not exists(select 1 from public.ron_signers roster where roster.ron_session_id=s.id and not exists(select 1 from jsonb_array_elements(e.metadata->'evidence'->'signers') x where x->>'signer_id'=roster.id::text))
 and jsonb_array_length(e.metadata->'executed_documents')>0
 and not exists(select 1 from public.ron_documents required where required.ron_session_id=s.id and required.uploaded_to_bluenotary=true and required.signed_sha256 is null
 and not exists(select 1 from jsonb_array_elements(e.metadata->'executed_documents') x join public.ron_documents output on output.id=(x->>'id')::uuid where output.source_ron_document_id=required.id))
 and not exists(select 1 from jsonb_array_elements(e.metadata->'executed_documents') x
 left join public.ron_documents d on d.id=(x->>'id')::uuid
 where d.id is null or d.ron_session_id<>s.id or d.matter_id<>s.matter_id or d.signed_sha256 is distinct from x->>'sha256'))
$$;

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
 if p_evidence - array['provider_reference','provider_evidence_reference','notary_identity_reference','commission_reference','notarial_act','executed_at','certificate_reference','seal_signature_reference','journal_reference','recording_reference','recording_retention_reference','recording_retained_until','custody_reference','qc_reference','signed_document_ids','signers','witnesses','external_provider_fee','commission_jurisdiction','commission_expires_at','act_count','qc_status'] <> '{}'::jsonb then raise exception 'UNSUPPORTED_EVIDENCE_FIELD'; end if;
 foreach k in array array['provider_reference','provider_evidence_reference','notary_identity_reference','commission_reference','commission_jurisdiction','certificate_reference','seal_signature_reference','journal_reference','recording_reference','recording_retention_reference','custody_reference','qc_reference'] loop
 if not public.p4_evidence_reference(p_evidence->k) then raise exception 'EVIDENCE_REFERENCE_REQUIRED: %',k; end if;
 end loop;
 if p_evidence ? 'external_provider_fee' and ((p_evidence->'external_provider_fee') - array['classification','reference'] <> '{}'::jsonb or p_evidence->'external_provider_fee'->>'classification' is distinct from 'EXTERNAL_PROVIDER_NOTARIAL_FEE' or not public.p4_evidence_reference(p_evidence->'external_provider_fee'->'reference')) then raise exception 'INVALID_EXTERNAL_PROVIDER_FEE_REFERENCE'; end if;
 if not exists(select 1 from public.execution_qa_reviews q where q.id::text=p_evidence->>'qc_reference' and q.deal_id=s.matter_id and q.checklist_type='RON_QA' and ((m.witnesses=0 and q.witness_status='NOT_REQUIRED') or (m.witnesses>0 and q.witness_status='COMPLETE')) and q.execution_qa_status='PASSED' and q.passed_by is not null and q.passed_at is not null and coalesce(cardinality(q.blocking_items),0)=0 and coalesce(cardinality(q.missing_items),0)=0) then raise exception 'GOVERNED_RON_QC_REQUIRED'; end if;
 if exists(select 1 from public.compliance_incidents i where i.deal_id=s.matter_id and i.status not in ('RESOLVED','CLOSED') and (i.freeze_triggered or i.severity in ('high','critical'))) then raise exception 'BLOCKING_EXECUTION_EXCEPTION'; end if;
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
 update public.ron_sessions set statutory_evidence_id=event_id,evidence_reopened_at=null,milano_ron_status='RON_COMPLETED',completed_at=(p_evidence->>'executed_at')::timestamptz where id=s.id;
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
 update public.ron_sessions set evidence_reopened_at=now(),milano_ron_status='RON_REVIEW_REQUIRED',completed_at=null where id=s.id;
 return jsonb_build_object('evidence_id',s.statutory_evidence_id,'reopen_event_id',event_id,'duplicate',false);
end $$;
revoke all on function public.reopen_ron_statutory_evidence(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reopen_ron_statutory_evidence(uuid,uuid,uuid,text) to service_role;

create or replace function public.guard_ron_evidence_history() returns trigger language plpgsql set search_path='' as $$
begin raise exception using errcode='42501',message='RON_EVIDENCE_APPEND_ONLY'; end $$;
drop trigger if exists ron_evidence_append_only on public.ron_audit_events;
create trigger ron_evidence_append_only before update or delete on public.ron_audit_events for each row execute function public.guard_ron_evidence_history();
create or replace function public.guard_ron_document_version() returns trigger language plpgsql set search_path='' as $$
begin
 if old.submitted_sha256 is not null and (TG_OP='DELETE' or old.submitted_sha256 is distinct from new.submitted_sha256 or old.submitted_storage_path is distinct from new.submitted_storage_path or old.storage_path is distinct from new.storage_path or old.storage_bucket is distinct from new.storage_bucket or old.uploaded_to_bluenotary is distinct from new.uploaded_to_bluenotary) then raise exception using errcode='42501',message='SUBMITTED_SOURCE_IMMUTABLE'; end if;
 if old.signed_sha256 is not null and (TG_OP='DELETE' or old.signed_sha256 is distinct from new.signed_sha256 or old.signed_storage_path is distinct from new.signed_storage_path or old.storage_bucket is distinct from new.storage_bucket or old.matter_id is distinct from new.matter_id or old.ron_session_id is distinct from new.ron_session_id or old.id is distinct from new.id or old.source_ron_document_id is distinct from new.source_ron_document_id or old.source_sha256 is distinct from new.source_sha256 or old.executed_version_id is distinct from new.executed_version_id or old.source_version_id is distinct from new.source_version_id) then raise exception using errcode='42501',message='EXECUTED_DOCUMENT_IMMUTABLE'; end if;
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
drop trigger if exists ron_executed_version_immutable on public.ron_documents;
create trigger ron_executed_version_immutable before update or delete on public.ron_documents for each row execute function public.guard_ron_document_version();
create or replace function public.guard_ron_canonical_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.ron_documents d where d.executed_version_id=old.id or d.source_version_id=old.id) and
 (TG_OP='DELETE' or new.id is distinct from old.id or new.matter_id is distinct from old.matter_id or new.file_hash is distinct from old.file_hash or new.source_file is distinct from old.source_file or new.stage is distinct from old.stage) then raise exception using errcode='42501',message='RON_CANONICAL_VERSION_IMMUTABLE'; end if;
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
create trigger ron_canonical_version_immutable before update or delete on public.document_versions for each row execute function public.guard_ron_canonical_version();
create or replace function public.guard_ron_evidence_completion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.milano_ron_status in ('RON_COMPLETED','SIGNED_DOCS_RETRIEVED','READY_FOR_APOSTILLE') and not public.ron_statutory_evidence_verified(new.id) then raise exception 'RON_STATUTORY_EVIDENCE_REQUIRED'; end if;
 return new;
end $$;
drop trigger if exists ron_completion_requires_evidence on public.ron_sessions;
-- AFTER observes the new evidence pointer within the same atomic RPC transaction.
create trigger ron_completion_requires_evidence after insert or update on public.ron_sessions for each row execute function public.guard_ron_evidence_completion();
create or replace function public.guard_matter_ron_completion() returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if new.execution_truth->>'execution_method'='ron' and (new.status in ('apostille_processing','in_transit','delivered','completed') or new.deal_status in ('apostille_processing','in_transit','delivered','completed')) and (old.status is distinct from new.status or old.deal_status is distinct from new.deal_status) then
 select id into sid from public.ron_sessions where matter_id=new.id order by created_at desc,id desc limit 1;
 if sid is null or not public.ron_statutory_evidence_verified(sid) then raise exception 'RON_STATUTORY_EVIDENCE_REQUIRED'; end if;
 end if;return new;
end $$;
drop trigger if exists matter_ron_completion_requires_evidence on public.deals;
create trigger matter_ron_completion_requires_evidence before update of status,deal_status on public.deals for each row execute function public.guard_matter_ron_completion();
create or replace function public.invalidate_ron_evidence_projection() returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if TG_OP='DELETE' then sid:=old.ron_session_id; else sid:=new.ron_session_id; end if;
 update public.ron_sessions set milano_ron_status='RON_REVIEW_REQUIRED' where id=sid and statutory_evidence_id is not null and not public.ron_statutory_evidence_verified(sid);
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
drop trigger if exists ron_artifact_invalidates_evidence on public.ron_documents;
create trigger ron_artifact_invalidates_evidence after insert or update on public.ron_documents for each row execute function public.invalidate_ron_evidence_projection();
drop trigger if exists ron_roster_invalidates_evidence on public.ron_signers;
create trigger ron_roster_invalidates_evidence after insert or update or delete on public.ron_signers for each row execute function public.invalidate_ron_evidence_projection();
revoke all on function public.append_ron_statutory_evidence(uuid,uuid,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.append_ron_statutory_evidence(uuid,uuid,uuid,uuid,jsonb,text) to service_role;
revoke all on function public.ron_statutory_evidence_verified(uuid),public.p4_evidence_reference(jsonb),public.p4_evidence_proof(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.ron_statutory_evidence_verified(uuid) to service_role;
commit;
