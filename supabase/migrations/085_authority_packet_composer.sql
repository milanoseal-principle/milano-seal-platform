begin;

-- 085_authority_packet_composer.sql
-- Operator-recorded authority packet facts and lifecycle, merged atomically
-- into canonical execution truth (execution_truth.authority_packet) with
-- evidence-ledger entries. Additive; no new Matter, pricing or payment table.
--
-- The packet status itself is recomputed server-side from canonical evidence
-- (official asset registry, preflight, execution, paper-out, fee provenance);
-- the service-role caller passes the recomputed status and this function only
-- permits the matching lifecycle step. The government fee is pass-through and
-- is never written to Milano revenue fields.

create or replace function public.record_matter_authority_packet(
  p_matter_id uuid,
  p_expected_updated_at timestamptz,
  p_action text,
  p_facts jsonb,
  p_computed_status text,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_reason text
)
returns table (matter jsonb, evidence_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matter public.deals%rowtype;
  v_truth jsonb;
  v_prior jsonb;
  v_packet jsonb;
  v_patch jsonb := '{}'::jsonb;
  v_event text;
  v_evidence_id uuid;
  v_count int;
begin
  if p_action not in ('build', 'assemble', 'approve') then
    raise exception using errcode = '22023', message = 'INVALID_PACKET_ACTION';
  end if;

  select * into v_matter from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;
  if v_matter.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'STALE_MATTER_STATE';
  end if;

  v_truth := coalesce(v_matter.execution_truth, '{}'::jsonb);
  v_prior := v_truth->'authority_packet';
  v_packet := coalesce(v_prior, '{}'::jsonb);

  if v_packet ? 'dispatched_at' then
    raise exception using errcode = '22023', message = 'PACKET_ALREADY_DISPATCHED';
  end if;

  if p_action = 'build' then
    p_facts := coalesce(p_facts, '{}'::jsonb);
    if p_facts ? 'authority_id' then
      if not exists (select 1 from public.state_authorities where id = (p_facts->>'authority_id')::uuid) then
        raise exception using errcode = '22023', message = 'UNKNOWN_AUTHORITY';
      end if;
      v_patch := v_patch || jsonb_build_object('authority_id', p_facts->>'authority_id');
    end if;
    if p_facts ? 'route_type' then
      if p_facts->>'route_type' not in ('florida_dos_apostille', 'florida_dos_notarial_certificate', 'other') then
        raise exception using errcode = '22023', message = 'INVALID_ROUTE_TYPE';
      end if;
      v_patch := v_patch || jsonb_build_object('route_type', p_facts->>'route_type');
    end if;
    if p_facts ? 'document_count' then
      if jsonb_typeof(p_facts->'document_count') <> 'number' then
        raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_COUNT';
      end if;
      v_count := (p_facts->>'document_count')::numeric::int;
      if v_count < 1 or v_count > 500 or (p_facts->>'document_count')::numeric <> v_count then
        raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_COUNT';
      end if;
      v_patch := v_patch || jsonb_build_object('document_count', v_count);
    end if;
    if p_facts ? 'destination_confirmed' then
      if jsonb_typeof(p_facts->'destination_confirmed') <> 'boolean' then
        raise exception using errcode = '22023', message = 'INVALID_DESTINATION_CONFIRMATION';
      end if;
      v_patch := v_patch || jsonb_build_object('destination_confirmed', (p_facts->>'destination_confirmed')::boolean);
    end if;
    if p_facts ? 'government_fee_method_status' then
      if p_facts->>'government_fee_method_status' not in ('ready', 'not_ready', 'unknown') then
        raise exception using errcode = '22023', message = 'INVALID_FEE_METHOD_STATUS';
      end if;
      v_patch := v_patch || jsonb_build_object('government_fee_method_status', p_facts->>'government_fee_method_status');
    end if;
    if p_facts ? 'return_shipping' then
      if p_facts->>'return_shipping' not in ('required', 'not_required', 'unknown') then
        raise exception using errcode = '22023', message = 'INVALID_RETURN_SHIPPING';
      end if;
      v_patch := v_patch || jsonb_build_object('return_shipping', p_facts->>'return_shipping');
    end if;
    -- Changing packet facts invalidates prior assembly and QA.
    v_packet := (v_packet - 'assembled_at' - 'assembled_by' - 'approved_at' - 'approved_by') || v_patch;
    if not (v_packet ? 'built_at') then
      v_packet := v_packet || jsonb_build_object('built_at', p_occurred_at, 'built_by', p_actor_id);
    end if;
    v_event := 'AUTHORITY_PACKET_BUILT';
  elsif p_action = 'assemble' then
    if v_prior is null then
      raise exception using errcode = '22023', message = 'PACKET_NOT_BUILT';
    end if;
    if p_computed_status is distinct from 'READY_TO_ASSEMBLE' then
      raise exception using errcode = '22023', message = 'PACKET_NOT_READY_TO_ASSEMBLE';
    end if;
    v_packet := v_packet || jsonb_build_object('assembled_at', p_occurred_at, 'assembled_by', p_actor_id);
    v_event := 'AUTHORITY_PACKET_ASSEMBLED';
  else
    if v_prior is null or not (v_packet ? 'assembled_at') then
      raise exception using errcode = '22023', message = 'PACKET_NOT_ASSEMBLED';
    end if;
    if p_computed_status is distinct from 'ASSEMBLED' then
      raise exception using errcode = '22023', message = 'PACKET_QA_NOT_PERMITTED';
    end if;
    v_packet := v_packet || jsonb_build_object('approved_at', p_occurred_at, 'approved_by', p_actor_id);
    v_event := 'AUTHORITY_PACKET_QA_APPROVED';
  end if;

  update public.deals
  set execution_truth = v_truth || jsonb_build_object('authority_packet', v_packet),
      last_activity = p_occurred_at,
      updated_at = p_occurred_at
  where id = p_matter_id
  returning * into v_matter;

  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, v_event, 'apostille_authentication', 'operator', p_actor_id,
    p_occurred_at, 'operator_authority_packet', coalesce(v_matter.deal_id, p_matter_id::text),
    coalesce(v_prior, '{}'::jsonb), v_packet, p_reason,
    jsonb_build_object('action', p_action, 'computed_status', p_computed_status)
  ) returning id into v_evidence_id;

  return query select to_jsonb(v_matter), v_evidence_id;
end;
$$;

revoke all on function public.record_matter_authority_packet(uuid, timestamptz, text, jsonb, text, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_matter_authority_packet(uuid, timestamptz, text, jsonb, text, uuid, timestamptz, text) to service_role;

commit;
