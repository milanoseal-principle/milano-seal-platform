begin;
-- Governed correction resumes review; historical completion stays immutable.
create or replace function public.enforce_ron_session_lifecycle()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  missing text[];
  governed_reopen boolean := false;
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

  governed_reopen := OLD.ron_lifecycle_state='COMPLETED' and NEW.ron_lifecycle_state='EVIDENCE_PENDING'
    and NEW.evidence_reopened_at is not null and NEW.evidence_reopened_at is distinct from OLD.evidence_reopened_at
    and exists(select 1 from public.ron_audit_events e where e.ron_session_id=OLD.id
      and e.event_type='RON_STATUTORY_EVIDENCE_REOPENED' and e.source='governed_ron_evidence'
      and e.supersedes_event_id=OLD.statutory_evidence_id and e.created_at>=NEW.evidence_reopened_at);

  if NEW.ron_lifecycle_state is distinct from OLD.ron_lifecycle_state
     and not governed_reopen
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

  if OLD.completed_at is not null
     and (NEW.matter_id, NEW.bn_session_id, NEW.provider_name, NEW.execution_completed_at, NEW.notary_name,
          NEW.notary_provider_reference, NEW.notary_commission_number, NEW.notary_commission_jurisdiction,
          NEW.notary_commission_expires_on, NEW.notary_ron_registration_reference, NEW.notarial_act_type,
          NEW.notarial_act_count, NEW.certificate_completion_reference, NEW.electronic_signature_reference,
          NEW.electronic_seal_reference, NEW.witness_requirement, NEW.journal_reference,
          NEW.av_recording_reference, NEW.provider_evidence_references, NEW.provider_fee_evidence_classification,
          NEW.provider_fee_evidence_reference,
          NEW.retention_class, NEW.retention_rule, NEW.retention_start_at, NEW.completed_at, NEW.milano_completed_by, NEW.qc_status, NEW.qc_review_reference)
     is distinct from
         (OLD.matter_id, OLD.bn_session_id, OLD.provider_name, OLD.execution_completed_at, OLD.notary_name,
          OLD.notary_provider_reference, OLD.notary_commission_number, OLD.notary_commission_jurisdiction,
          OLD.notary_commission_expires_on, OLD.notary_ron_registration_reference, OLD.notarial_act_type,
          OLD.notarial_act_count, OLD.certificate_completion_reference, OLD.electronic_signature_reference,
          OLD.electronic_seal_reference, OLD.witness_requirement, OLD.journal_reference,
          OLD.av_recording_reference, OLD.provider_evidence_references, OLD.provider_fee_evidence_classification,
          OLD.provider_fee_evidence_reference,
          OLD.retention_class, OLD.retention_rule, OLD.retention_start_at, OLD.completed_at, OLD.milano_completed_by, OLD.qc_status, OLD.qc_review_reference) then
    raise exception using errcode = '42501', message = 'RON_EVIDENCE_FROZEN';
  end if;

  if OLD.ron_lifecycle_state = 'COMPLETED'
     and (NEW.qc_status, NEW.qc_review_reference, NEW.completed_at, NEW.milano_completed_by)
         is distinct from (OLD.qc_status, OLD.qc_review_reference, OLD.completed_at, OLD.milano_completed_by) then
    raise exception using errcode = '42501', message = 'RON_EVIDENCE_FROZEN';
  end if;

  if NEW.ron_lifecycle_state = 'EVIDENCE_PENDING' and (OLD.ron_lifecycle_state = 'EVIDENCE_VERIFIED' or governed_reopen) then
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
 values(s.matter_id,s.id,'RON_STATUTORY_EVIDENCE_REOPENED',p_reason,p_actor_id,'operator','governed_ron_evidence',jsonb_build_object('previous_evidence_id',s.statutory_evidence_id,'previous_lifecycle',s.ron_lifecycle_state,'historical_completed_at',s.completed_at,'historical_completed_by',s.milano_completed_by,'previous_verification_hash',s.evidence_verification_hash,'previous_verified_at',s.evidence_verified_at,'previous_verified_by',s.evidence_verified_by),s.statutory_evidence_id) returning id into event_id;
 update public.ron_sessions set evidence_reopened_at=now(),ron_lifecycle_state=case when s.ron_lifecycle_state in ('COMPLETED','EVIDENCE_VERIFIED') then 'EVIDENCE_PENDING' else s.ron_lifecycle_state end,milano_ron_status='RON_REVIEW_REQUIRED' where id=s.id;
 return jsonb_build_object('evidence_id',s.statutory_evidence_id,'reopen_event_id',event_id,'duplicate',false);
end $$;

revoke all on function public.enforce_ron_session_lifecycle() from public,anon,authenticated;
revoke all on function public.reopen_ron_statutory_evidence(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reopen_ron_statutory_evidence(uuid,uuid,uuid,text) to service_role;
commit;
