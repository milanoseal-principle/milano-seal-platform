begin;

alter table public.deals add column if not exists customer_execution_preference text
  check (customer_execution_preference is null or customer_execution_preference in
    ('ron','in_person','mobile','already_notarized','third_party_notary','review_required'));

-- One locked source lead -> one canonical Matter. Repeated calls return the
-- original linkage. Lead creation, linkage and evidence commit or roll back together.
create or replace function public.convert_sales_lead_to_matter(p_lead_id uuid, p_actor_id uuid)
returns table(matter_id uuid, duplicate boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_lead public.sales_leads%rowtype;
  v_id uuid;
  v_preference text;
  v_truth jsonb;
  v_now timestamptz := now();
begin
  if not exists (select 1 from auth.users u where u.id = p_actor_id
    and coalesce(u.raw_app_meta_data->>'disabled','false') <> 'true'
    and (u.banned_until is null or u.banned_until <= v_now)
    and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')) then
    raise exception using errcode='42501', message='FORBIDDEN';
  end if;
  select * into v_lead from public.sales_leads where id=p_lead_id for update;
  if not found then raise exception using errcode='P0002', message='LEAD_NOT_FOUND'; end if;
  if v_lead.canonical_matter_id is not null then
    return query select v_lead.canonical_matter_id, true;
    return;
  end if;
  if v_lead.lead_type not in ('pricing_request','concierge_inquiry','client_intake') or v_lead.lead_type is null then
    raise exception using errcode='22023', message='LEAD_REQUIRES_ITS_GOVERNED_WORKFLOW';
  end if;
  if nullif(trim(v_lead.full_name),'') is null or nullif(trim(v_lead.email),'') is null then
    raise exception using errcode='22023', message='LEAD_CONTACT_REQUIRED';
  end if;
  v_preference := coalesce(v_lead.details->>'customer_execution_preference', v_lead.details->>'execution_preference',
    case when v_lead.product_interest='ron' then 'ron' else 'review_required' end);
  if v_preference not in ('ron','in_person','mobile','already_notarized','third_party_notary','review_required') then v_preference := 'review_required'; end if;
  v_truth := jsonb_build_object('version',1,'notarization_requirement','review_required',
    'execution_method','review_required','notarial_act','review_required','authentication_requirement','review_required',
    'signer_location',nullif(v_lead.details->>'signer_location',''),
    'execution_location',null,'assigned_notary',null,'notary_jurisdiction',null,'certificate_type',null,
    'ron_kba_status',null,'ron_credential_analysis_status',null);
  insert into public.deals (deal_id, access_token, client_name, email, phone, document_type,
    destination_country, origin_state, customer_execution_preference, execution_truth,
    payment_status, payment_confirmed, amount_paid, currency, status, deal_status,
    quote_review_required, quote_review_reasons, internal_notes)
  values ('MS-' || extract(year from v_now)::text || '-' || p_lead_id::text, gen_random_uuid()::text,
    v_lead.full_name, lower(trim(v_lead.email)), v_lead.phone, v_lead.document_type,
    coalesce(nullif(trim(v_lead.country),''), nullif(trim(v_lead.details->>'destination'),'')),
    nullif(v_lead.details->>'document_origin',''), v_preference, v_truth,
    'unpaid',false,0,'USD','intake_received','reviewing',true,'["EXECUTION_REVIEW_REQUIRED"]'::jsonb,
    jsonb_build_object('source_lead_id',v_lead.id,'source_route',v_lead.source_route,'service_intent',v_lead.product_interest,
      'lead_context',v_lead.details,'execution_review',jsonb_build_object('required',true))::text)
  returning id into v_id;
  update public.sales_leads set canonical_matter_id=v_id,linked_by=p_actor_id,linked_at=v_now where id=p_lead_id;
  insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,actor_id,occurred_at,source,source_reference,new_value,reason)
  values(v_id,'LEAD_LINKED_TO_MATTER','execution','operator',p_actor_id,v_now,'operator_lead_conversion',p_lead_id::text,
    jsonb_build_object('lead_id',p_lead_id,'matter_id',v_id,'customer_execution_preference',v_preference),
    'Operator opened canonical Matter review; no pricing, payment or execution authority was established.');
  return query select v_id,false;
end;
$$;

-- Extends the existing execution truth and append-only evidence, never a new
-- Matter/review model. No price, payment, scheduling or completion fields change.
create or replace function public.confirm_matter_execution_review(
  p_matter_id uuid, p_expected_updated_at timestamptz, p_truth jsonb, p_review jsonb, p_actor_id uuid
) returns table(matter jsonb, evidence_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_matter public.deals%rowtype;
  v_prior jsonb;
  v_now timestamptz := now();
  v_evidence_id uuid;
begin
  if not exists (select 1 from auth.users u where u.id=p_actor_id
    and coalesce(u.raw_app_meta_data->>'disabled','false') <> 'true'
    and (u.banned_until is null or u.banned_until <= v_now)
    and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')) then
    raise exception using errcode='42501',message='FORBIDDEN';
  end if;
  if p_review->>'document_reviewed' is distinct from 'true' or
    p_review->>'signer_reviewed' is distinct from 'true' or
    p_review->>'witness_reviewed' is distinct from 'true' or
    p_review->>'eligibility_reviewed' is distinct from 'true' or
    nullif(trim(p_review->>'reason'),'') is null or
    coalesce(p_truth->>'notarization_requirement','review_required') not in ('required','not_required') or
    coalesce(p_truth->>'authentication_requirement','review_required') not in ('apostille','authentication_legalization','not_required') then
    raise exception using errcode='22023',message='EXECUTION_REVIEW_INCOMPLETE';
  end if;
  if p_truth->>'notarization_requirement'='required' and
    (coalesce(p_truth->>'execution_method','review_required') not in ('ron','in_person','mobile','third_party_notary') or
     coalesce(p_truth->>'notarial_act','review_required') not in ('acknowledgment','jurat','oath_affirmation','signature_witnessing','other')) then
    raise exception using errcode='22023',message='EXECUTION_REVIEW_INCOMPLETE';
  end if;
  if nullif(trim(p_truth->>'signer_location'),'') is null or
    (p_truth->>'execution_method' in ('in_person','mobile') and nullif(trim(p_truth->>'execution_location'),'') is null) or
    (p_truth->>'execution_method'='ron' and (p_truth->>'ron_kba_status' is distinct from 'required' or p_truth->>'ron_credential_analysis_status' is distinct from 'required')) then
    raise exception using errcode='22023',message='EXECUTION_REVIEW_INCOMPLETE';
  end if;
  select * into v_matter from public.deals where id=p_matter_id for update;
  if not found then raise exception using errcode='P0002',message='MATTER_NOT_FOUND'; end if;
  if v_matter.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode='40001',message='STALE_MATTER_STATE';
  end if;
  if v_matter.payment_status <> 'unpaid' or coalesce(v_matter.amount_paid,0)>0 or v_matter.payment_observed_at is not null or v_matter.quote_approved_at is not null or
    v_matter.deal_status not in ('new','reviewing','quoted','awaiting_payment') then
    raise exception using errcode='22023',message='EXECUTION_REVIEW_LOCKED';
  end if;
  v_prior := coalesce(v_matter.execution_truth,'{}'::jsonb);
  -- Preserve existing provider/authority evidence, merging only normalized
  -- execution fields. The server supplies the normalized allowlisted object.
  update public.deals set execution_truth=v_prior || p_truth || jsonb_build_object('review_confirmed_by',p_actor_id,'review_confirmed_at',v_now),
    mobile=p_truth->>'execution_method'='mobile',
    apostille_required=p_truth->>'authentication_requirement'='apostille',
    signers=(p_review->>'signer_count')::integer,
    witnesses=(p_review->>'witness_count')::integer,
    status=case when status='intake_received' then 'under_review' else status end, deal_status='reviewing',
    quote_review_required=true, quote_approved_at=null, quote_approved_by=null,
    quote_review_reasons='["REQUOTE_AFTER_EXECUTION_REVIEW"]'::jsonb,
    updated_at=v_now,last_activity=v_now
  where id=p_matter_id returning * into v_matter;
  insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,actor_id,occurred_at,source,prior_value,new_value,reason,metadata)
  values(p_matter_id,'EXECUTION_REVIEW_CONFIRMED','execution','operator',p_actor_id,v_now,'operator_execution_review',
    v_prior,v_matter.execution_truth,p_review->>'reason',p_review)
  returning id into v_evidence_id;
  return query select to_jsonb(v_matter),v_evidence_id;
end;
$$;

revoke all on function public.convert_sales_lead_to_matter(uuid,uuid) from public,anon,authenticated;
grant execute on function public.convert_sales_lead_to_matter(uuid,uuid) to service_role;
revoke all on function public.confirm_matter_execution_review(uuid,timestamptz,jsonb,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.confirm_matter_execution_review(uuid,timestamptz,jsonb,jsonb,uuid) to service_role;
-- Private quote approval advances the existing canonical state machine in its
-- required order under one lock; the existing trigger writes each transition.
create or replace function public.approve_reviewed_matter_quote(
  p_matter_id uuid, p_expected_updated_at timestamptz, p_updates jsonb,
  p_actor_id uuid, p_route_evidence jsonb
) returns table(matter jsonb)
language plpgsql security definer set search_path = '' as $$
declare
  v public.deals%rowtype;
  q public.deals%rowtype;
  v_now timestamptz := now();
begin
  if not exists(select 1 from auth.users u where u.id=p_actor_id
    and coalesce(u.raw_app_meta_data->>'disabled','false') <> 'true'
    and (u.banned_until is null or u.banned_until <= v_now)
    and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')) then
    raise exception using errcode='42501',message='FORBIDDEN';
  end if;
  select * into v from public.deals where id=p_matter_id for update;
  if not found then raise exception using errcode='P0002',message='MATTER_NOT_FOUND'; end if;
  if v.updated_at is distinct from p_expected_updated_at then raise exception using errcode='40001',message='STALE_MATTER_STATE'; end if;
  if v.payment_status <> 'unpaid' or coalesce(v.amount_paid,0)>0 or v.payment_observed_at is not null or
    v.execution_truth->>'review_confirmed_by' is null or v.execution_truth->>'review_confirmed_at' is null or
    v.execution_truth is distinct from p_updates->'execution_truth' then
    raise exception using errcode='22023',message='QUOTE_AUTHORITY_CONFLICT';
  end if;
  q := jsonb_populate_record(null::public.deals,p_updates);
  if q.total_price is null or q.total_price <= 0 or q.total_price::text in ('NaN','Infinity','-Infinity') or
    q.final_total is distinct from q.total_price or q.original_total is distinct from q.total_price or
    q.amount_due is distinct from q.invoice_retainer or q.invoice_retainer <= 0 or q.invoice_balance < 0 or
    round(q.total_price,2) is distinct from q.total_price or round(q.invoice_retainer,2) is distinct from q.invoice_retainer or
    q.invoice_retainer+q.invoice_balance is distinct from q.total_price or
    q.currency is distinct from 'USD' or q.quote_approved_by is null or q.quote_breakdown is null then
    raise exception using errcode='22023',message='INVALID_CANONICAL_QUOTE';
  end if;
  if v.status='intake_received' then update public.deals set status='under_review' where id=p_matter_id; v.status:='under_review'; end if;
  if v.status='under_review' then update public.deals set status='quoted' where id=p_matter_id; v.status:='quoted'; end if;
  if v.status='quoted' then update public.deals set status='awaiting_payment' where id=p_matter_id; v.status:='awaiting_payment'; end if;
  if v.status <> 'awaiting_payment' then raise exception using errcode='22023',message='INVALID_QUOTE_STATE'; end if;
  update public.deals set lane=q.lane,execution_tier=q.execution_tier,base_price=q.base_price,witness_total=q.witness_total,
    eligible_subtotal=q.eligible_subtotal,non_discountable_total=q.non_discountable_total,
    original_total=q.original_total,discount_amount=0,final_total=q.final_total,total_price=q.total_price,
    invoice_subtotal=q.invoice_subtotal,invoice_retainer=q.invoice_retainer,invoice_balance=q.invoice_balance,
    amount_due=q.amount_due,currency=q.currency,deal_status='awaiting_payment',
    matter_pricing_type=q.matter_pricing_type,quote_execution_method=q.quote_execution_method,
    pricing_version=q.pricing_version,quote_breakdown=q.quote_breakdown,
    quote_review_required=false,quote_review_reasons='[]'::jsonb,
    quote_approved_at=v_now,quote_approved_by=q.quote_approved_by,updated_at=v_now
  where id=p_matter_id returning * into v;
  insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,actor_id,occurred_at,source,new_value,reason,metadata)
  values(p_matter_id,'canonical_quote_approved','pricing','operator',p_actor_id,v_now,'operator_quote_builder',
    jsonb_build_object('subtotal',q.original_total,'deposit_amount',q.invoice_retainer,'balance_due',q.invoice_balance,
      'line_items',q.quote_breakdown,'route_intelligence',p_route_evidence),
    'Reviewed canonical private quote approved for payment gating.',jsonb_build_object('pricing_version',q.pricing_version));
  return query select to_jsonb(v);
end;
$$;
revoke all on function public.approve_reviewed_matter_quote(uuid,timestamptz,jsonb,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.approve_reviewed_matter_quote(uuid,timestamptz,jsonb,uuid,jsonb) to service_role;
commit;
