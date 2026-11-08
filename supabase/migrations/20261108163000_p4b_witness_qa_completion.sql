-- P4B corrective forward migration: governed witness QA completion.
-- Never rewrite applied P4/P4B migrations. Apply only through reviewed migration ordering.
-- No client role may execute this server-only, atomic witness evidence writer.
begin;

create or replace function public.complete_ron_witness_qa(
  p_matter uuid,
  p_review uuid,
  p_session uuid,
  p_actor uuid,
  p_reference text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_review public.execution_qa_reviews%rowtype;
  v_required integer;
  v_verified integer;
  v_lifecycle text;
begin
  if p_actor is null or p_matter is null or p_review is null or p_session is null
     or p_reference is null or p_reference !~ '^[A-Za-z0-9][A-Za-z0-9:_./-]{2,255}$' then
    raise exception 'WITNESS_QA_VALIDATED_EVIDENCE_REFERENCE_REQUIRED';
  end if;

  select * into v_review from public.execution_qa_reviews
    where id = p_review and deal_id = p_matter and checklist_type = 'RON_QA'
    for update;
  if not found then raise exception 'RON_QA_REVIEW_NOT_FOUND'; end if;

  -- A replay of a completed review returns its existing identifier; never
  -- append another completion event for the same review.
  if v_review.witness_status = 'COMPLETE' then return v_review.id; end if;
  if v_review.execution_qa_status in ('PASSED', 'BLOCKED')
     or v_review.witness_status = 'FAILED' then
    raise exception 'RON_QA_REVIEW_NOT_EDITABLE';
  end if;

  select coalesce(witnesses, 0)::integer into v_required
  from public.deals where id = p_matter;
  if not found or v_required <= 0 then
    raise exception 'GOVERNED_WITNESS_REQUIREMENT_MISSING';
  end if;

  select s.ron_lifecycle_state into v_lifecycle
    from public.ron_sessions s where s.id = p_session and s.matter_id = p_matter;
  if not found or v_lifecycle not in
     ('PROVIDER_SESSION_COMPLETED','EVIDENCE_PENDING','EVIDENCE_VERIFIED') then
    raise exception 'RON_PROVIDER_COMPLETION_EVIDENCE_REQUIRED';
  end if;

  select count(distinct w.id) into v_verified
  from public.ron_signers w
  where w.ron_session_id = p_session
    and w.party_role = 'witness'
    and nullif(btrim(w.witness_evidence_reference), '') is not null
    and w.witness_appearance in ('remote','physical');

  if v_verified < v_required then
    raise exception 'WITNESS_EVIDENCE_INCOMPLETE';
  end if;

  update public.execution_qa_reviews
     set witness_status = 'COMPLETE', reviewed_by = p_actor,
         reviewed_at = now(), updated_at = now()
    where id = p_review;

  -- Same SQL transaction as the status update: failed audit insertion rolls
  -- back the status rather than producing an unaudited witness completion.
  insert into public.matter_evidence_ledger
    (matter_id, event_type, domain, actor_type, actor_id, source,
     source_reference, evidence_reference, prior_value, new_value,
     correlation_id, metadata)
  values
    (p_matter, 'RON_WITNESS_QA_COMPLETED', 'witness', 'operator', p_actor,
     'dashboard_ron_witness_qa', p_session::text, p_reference,
     jsonb_build_object('witness_status', v_review.witness_status),
     jsonb_build_object('witness_status', 'COMPLETE'),
     'ron_witness_qa:' || p_review::text,
     jsonb_build_object('qa_review_id', p_review, 'verified_witness_count', v_verified));

  return p_review;
end;
$$;

revoke all on function public.complete_ron_witness_qa(uuid,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.complete_ron_witness_qa(uuid,uuid,uuid,uuid,text)
  to service_role;

comment on function public.complete_ron_witness_qa(uuid,uuid,uuid,uuid,text) is
  'Server-only atomic witness QA completion; requires governed Matter witness count, provider-completed RON session, recorded witness references, and append-only Matter evidence.';

commit;
