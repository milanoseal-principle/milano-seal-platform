begin;

-- 085_authority_packet_composer.sql
-- Operator-recorded authority packet state, merged atomically into canonical
-- execution truth (execution_truth.authority_packet) with append-only
-- evidence-ledger entries. Additive: no new Matter, packet, pricing, payment,
-- shipment or state-machine table. Source documents, authority facts, fees,
-- shipment facts and execution facts stay in their canonical records.
--
-- Packet readiness is recomputed server-side from canonical evidence before
-- every action (official asset registry, preflight, execution, paper-out,
-- authority provenance, custody). The service-role caller passes that
-- recomputed status; this function only permits the lifecycle step that
-- matches it. The government fee is pass-through and is never written to any
-- Milano revenue or client payment field.

create or replace function public.record_matter_authority_packet(
  p_matter_id uuid,
  p_expected_updated_at timestamptz,
  p_action text,
  p_facts jsonb,
  p_computed_status text,
  p_evidence jsonb,
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
  v_count numeric;
  v_key text;
  v_qa jsonb;
  v_confirmations text[] := array[
    'document_count_confirmed', 'official_form_confirmed', 'authority_confirmed', 'fees_confirmed',
    'payment_instrument_confirmed', 'return_shipping_confirmed', 'destination_confirmed', 'paper_out_confirmed'
  ];
begin
  if p_action not in ('evaluate', 'assemble', 'qa', 'approve_dispatch') then
    raise exception using errcode = '22023', message = 'INVALID_PACKET_ACTION';
  end if;
  if p_computed_status is null or p_computed_status not in
    ('NOT_READY', 'REVIEW_REQUIRED', 'READY_TO_ASSEMBLE', 'ASSEMBLED', 'READY_FOR_DISPATCH', 'DISPATCHED') then
    raise exception using errcode = '22023', message = 'INVALID_COMPUTED_STATUS';
  end if;
  if coalesce(length(trim(p_reason)), 0) < 10 then
    raise exception using errcode = '22023', message = 'EVIDENCE_NOTE_REQUIRED';
  end if;

  select * into v_matter from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;
  if v_matter.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'STALE_MATTER_STATE';
  end if;
  if p_computed_status = 'DISPATCHED' then
    raise exception using errcode = '22023', message = 'PACKET_ALREADY_DISPATCHED';
  end if;

  v_truth := coalesce(v_matter.execution_truth, '{}'::jsonb);
  v_prior := v_truth->'authority_packet';
  v_packet := coalesce(v_prior, '{}'::jsonb);

  if p_action = 'evaluate' then
    p_facts := coalesce(p_facts, '{}'::jsonb);
    if jsonb_typeof(p_facts) <> 'object' then
      raise exception using errcode = '22023', message = 'INVALID_PACKET_FACTS';
    end if;
    for v_key in select jsonb_object_keys(p_facts) loop
      if v_key not in ('authority_id', 'route_type', 'document_count', 'government_fee_payment_method',
                       'return_shipment_mode', 'paper_out_not_applicable') then
        raise exception using errcode = '22023', message = 'INVALID_PACKET_FACT';
      end if;
    end loop;
    if p_facts ? 'authority_id' then
      if (p_facts->>'authority_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         or not exists (select 1 from public.state_authorities where id = (p_facts->>'authority_id')::uuid) then
        raise exception using errcode = '22023', message = 'UNKNOWN_AUTHORITY';
      end if;
      v_patch := v_patch || jsonb_build_object('authority_id', p_facts->>'authority_id');
    end if;
    if p_facts ? 'route_type' then
      if p_facts->>'route_type' not in ('florida_dos_apostille', 'florida_dos_notarial_certificate') then
        raise exception using errcode = '22023', message = 'INVALID_ROUTE_TYPE';
      end if;
      v_patch := v_patch || jsonb_build_object('route_type', p_facts->>'route_type');
    end if;
    if p_facts ? 'document_count' then
      if jsonb_typeof(p_facts->'document_count') <> 'number' then
        raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_COUNT';
      end if;
      v_count := (p_facts->>'document_count')::numeric;
      if v_count < 1 or v_count > 500 or v_count <> trunc(v_count) then
        raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_COUNT';
      end if;
      v_patch := v_patch || jsonb_build_object('document_count', v_count::int);
    end if;
    if p_facts ? 'government_fee_payment_method' then
      if p_facts->>'government_fee_payment_method' not in ('UNKNOWN', 'REQUIRED', 'READY', 'NOT_REQUIRED') then
        raise exception using errcode = '22023', message = 'INVALID_FEE_PAYMENT_METHOD';
      end if;
      v_patch := v_patch || jsonb_build_object('government_fee_payment_method', p_facts->>'government_fee_payment_method');
    end if;
    if p_facts ? 'return_shipment_mode' then
      if p_facts->>'return_shipment_mode' not in ('outbound_only', 'outbound_prepaid_return', 'manual_return', 'unknown') then
        raise exception using errcode = '22023', message = 'INVALID_RETURN_SHIPMENT_MODE';
      end if;
      v_patch := v_patch || jsonb_build_object('return_shipment_mode', p_facts->>'return_shipment_mode');
    end if;
    if p_facts ? 'paper_out_not_applicable' then
      if jsonb_typeof(p_facts->'paper_out_not_applicable') <> 'boolean' then
        raise exception using errcode = '22023', message = 'INVALID_PAPER_OUT_APPLICABILITY';
      end if;
      if (p_facts->>'paper_out_not_applicable')::boolean then
        if not (v_packet ? 'paper_out_not_applicable_at') then
          v_patch := v_patch || jsonb_build_object('paper_out_not_applicable_at', p_occurred_at, 'paper_out_not_applicable_by', p_actor_id);
        end if;
      else
        v_packet := v_packet - 'paper_out_not_applicable_at' - 'paper_out_not_applicable_by';
      end if;
    end if;
    -- Any changed fact invalidates prior assembly, QA and dispatch approval.
    if exists (
      select 1 from jsonb_each(v_patch) as p(key, value)
      where (v_prior -> p.key) is distinct from p.value
        and p.key not in ('paper_out_not_applicable_at', 'paper_out_not_applicable_by')
    ) or ((p_facts ? 'paper_out_not_applicable') and (v_prior ? 'paper_out_not_applicable_at') is distinct from (p_facts->>'paper_out_not_applicable')::boolean) then
      v_packet := v_packet - 'assembled_at' - 'assembled_by' - 'qa' - 'dispatch_ready_at' - 'dispatch_approved_by';
    end if;
    v_packet := v_packet || v_patch || jsonb_build_object('evaluated_at', p_occurred_at, 'evaluated_by', p_actor_id);
    v_event := 'AUTHORITY_PACKET_EVALUATED';
  elsif p_action = 'assemble' then
    if v_prior is null then
      raise exception using errcode = '22023', message = 'PACKET_NOT_EVALUATED';
    end if;
    if p_computed_status <> 'READY_TO_ASSEMBLE' then
      raise exception using errcode = '22023', message = 'PACKET_NOT_READY_TO_ASSEMBLE';
    end if;
    v_packet := v_packet || jsonb_build_object('assembled_at', p_occurred_at, 'assembled_by', p_actor_id);
    v_event := 'AUTHORITY_PACKET_ASSEMBLED';
  elsif p_action = 'qa' then
    if v_prior is null or not (v_packet ? 'assembled_at') then
      raise exception using errcode = '22023', message = 'PACKET_NOT_ASSEMBLED';
    end if;
    if p_computed_status <> 'ASSEMBLED' then
      raise exception using errcode = '22023', message = 'PACKET_QA_NOT_PERMITTED';
    end if;
    p_facts := coalesce(p_facts, '{}'::jsonb);
    foreach v_key in array v_confirmations loop
      if coalesce(p_facts->v_key, 'false'::jsonb) <> 'true'::jsonb then
        raise exception using errcode = '22023', message = 'PACKET_QA_INCOMPLETE';
      end if;
    end loop;
    v_qa := jsonb_build_object('operator_note', left(trim(p_reason), 1000), 'approved_by', p_actor_id, 'approved_at', p_occurred_at);
    foreach v_key in array v_confirmations loop
      v_qa := v_qa || jsonb_build_object(v_key, true);
    end loop;
    v_packet := (v_packet - 'dispatch_ready_at' - 'dispatch_approved_by') || jsonb_build_object('qa', v_qa);
    v_event := 'AUTHORITY_PACKET_QA_COMPLETED';
  else
    if v_prior is null or not (v_packet ? 'assembled_at') or not (v_packet ? 'qa') then
      raise exception using errcode = '22023', message = 'PACKET_QA_NOT_COMPLETE';
    end if;
    if p_computed_status <> 'ASSEMBLED' then
      raise exception using errcode = '22023', message = 'PACKET_DISPATCH_NOT_PERMITTED';
    end if;
    foreach v_key in array v_confirmations loop
      if coalesce(v_packet->'qa'->v_key, 'false'::jsonb) <> 'true'::jsonb then
        raise exception using errcode = '22023', message = 'PACKET_QA_NOT_COMPLETE';
      end if;
    end loop;
    v_packet := v_packet || jsonb_build_object('dispatch_ready_at', p_occurred_at, 'dispatch_approved_by', p_actor_id);
    v_event := 'AUTHORITY_PACKET_READY_FOR_DISPATCH';
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
    coalesce(v_prior, '{}'::jsonb), v_packet, left(trim(p_reason), 1000),
    jsonb_build_object('action', p_action, 'status_before', p_computed_status)
      || coalesce(p_evidence, '{}'::jsonb)
  ) returning id into v_evidence_id;

  return query select to_jsonb(v_matter), v_evidence_id;
end;
$$;

revoke all on function public.record_matter_authority_packet(uuid, timestamptz, text, jsonb, text, jsonb, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_matter_authority_packet(uuid, timestamptz, text, jsonb, text, jsonb, uuid, timestamptz, text) to service_role;

commit;
