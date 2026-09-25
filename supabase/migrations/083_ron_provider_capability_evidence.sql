begin;

-- Provider-driven RON capability evidence on the existing ron_sessions table.
-- Additive/idempotent. Stores provider-safe references only: never passport
-- numbers, MRZ strings, NFC payloads, document or selfie images, biometric
-- frames or vectors, KBA questions or answers, or provider secrets.

alter table public.ron_sessions
  add column if not exists ron_provider text,
  add column if not exists selected_identity_method text,
  add column if not exists identity_evidence_reference text,
  add column if not exists provider_eligibility_status text,
  add column if not exists capability_verified_at timestamptz;

alter table public.ron_sessions
  drop constraint if exists ron_sessions_selected_identity_method_check;
alter table public.ron_sessions
  add constraint ron_sessions_selected_identity_method_check
  check (
    selected_identity_method is null or selected_identity_method in (
      'credential_analysis',
      'identity_proofing',
      'kba',
      'biometric_idv',
      'passport_idv',
      'credible_witness',
      'other_provider_supported_method'
    )
  );

alter table public.ron_sessions
  drop constraint if exists ron_sessions_provider_eligibility_status_check;
alter table public.ron_sessions
  add constraint ron_sessions_provider_eligibility_status_check
  check (
    provider_eligibility_status is null or
    provider_eligibility_status in ('ELIGIBLE', 'REVIEW_REQUIRED', 'INELIGIBLE')
  );

-- Operator-recorded receiving-authority RON posture, merged atomically into
-- canonical execution truth with an evidence-ledger entry (same pattern as
-- confirm_matter_notarial_act). Only whitelisted keys/values are accepted.
create or replace function public.record_matter_ron_posture(
  p_matter_id uuid,
  p_expected_updated_at timestamptz,
  p_posture jsonb,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_source text,
  p_reason text
)
returns table (matter jsonb, evidence_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matter public.deals%rowtype;
  v_prior jsonb;
  v_patch jsonb := '{}'::jsonb;
  v_evidence_id uuid;
begin
  if p_posture ? 'receiving_authority_ron_acceptance' then
    if p_posture->>'receiving_authority_ron_acceptance' not in ('accepted','not_accepted','unknown') then
      raise exception using errcode = '22023', message = 'INVALID_RON_ACCEPTANCE';
    end if;
    v_patch := v_patch || jsonb_build_object('receiving_authority_ron_acceptance', p_posture->>'receiving_authority_ron_acceptance');
  end if;
  if p_posture ? 'wet_ink_requirement' then
    if p_posture->>'wet_ink_requirement' not in ('required','not_required','unknown') then
      raise exception using errcode = '22023', message = 'INVALID_WET_INK_REQUIREMENT';
    end if;
    v_patch := v_patch || jsonb_build_object('wet_ink_requirement', p_posture->>'wet_ink_requirement');
  end if;
  if p_posture ? 'original_requirement' then
    if p_posture->>'original_requirement' not in ('required','not_required','unknown') then
      raise exception using errcode = '22023', message = 'INVALID_ORIGINAL_REQUIREMENT';
    end if;
    v_patch := v_patch || jsonb_build_object('original_requirement', p_posture->>'original_requirement');
  end if;
  if p_posture ? 'receiving_authority' then
    v_patch := v_patch || jsonb_build_object('receiving_authority', left(coalesce(p_posture->>'receiving_authority', ''), 200));
  end if;
  if v_patch = '{}'::jsonb then
    raise exception using errcode = '22023', message = 'EMPTY_RON_POSTURE';
  end if;

  select * into v_matter from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;
  if v_matter.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'STALE_MATTER_STATE';
  end if;

  v_prior := coalesce(v_matter.execution_truth, '{}'::jsonb);
  update public.deals
  set execution_truth = v_prior || v_patch,
      last_activity = p_occurred_at,
      updated_at = p_occurred_at
  where id = p_matter_id
  returning * into v_matter;

  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, 'RON_AUTHORITY_POSTURE_RECORDED', 'execution', 'operator', p_actor_id,
    p_occurred_at, p_source, coalesce(v_matter.deal_id, p_matter_id::text),
    (select coalesce(jsonb_object_agg(key, v_prior->key), '{}'::jsonb) from jsonb_object_keys(v_patch) as key),
    v_patch, p_reason, jsonb_build_object('fields', (select jsonb_agg(key) from jsonb_object_keys(v_patch) as key))
  ) returning id into v_evidence_id;

  return query select to_jsonb(v_matter), v_evidence_id;
end;
$$;

revoke all on function public.record_matter_ron_posture(uuid, timestamptz, jsonb, uuid, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.record_matter_ron_posture(uuid, timestamptz, jsonb, uuid, timestamptz, text, text) to service_role;

comment on column public.ron_sessions.identity_evidence_reference is
  'Provider-safe identity evidence reference (provider:session:id:method). Never raw identity content.';

commit;
