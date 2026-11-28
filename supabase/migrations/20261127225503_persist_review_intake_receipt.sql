-- Commit the review-only Matter and replay receipt in the same transaction.
begin;

create function public.persist_review_intake_receipt(
  p_token_hash text, p_payload_hash text, p_deal jsonb, p_response_body jsonb
)
returns table(id uuid, deal_id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation public.intake_submission_idempotency;
  deal_row public.deals;
  saved_id public.deals.id%type;
  saved_deal_id public.deals.deal_id%type;
begin
  select s.* into reservation
  from public.intake_submission_idempotency s
  where s.token_hash = p_token_hash
  for update;

  if not found or reservation.payload_hash is distinct from p_payload_hash
    or reservation.state <> 'processing' then
    raise exception 'INTAKE_IDEMPOTENCY_RESERVATION_NOT_ACTIVE' using errcode = '22023';
  end if;

  deal_row := jsonb_populate_record(null::public.deals, p_deal);
  if deal_row.deal_id is null
    or deal_row.deal_id is distinct from p_response_body->>'deal_id'
    or p_response_body->'success' is distinct from 'true'::jsonb
    or p_response_body->>'quote_state' is distinct from 'review_required'
    or deal_row.status is distinct from 'intake_received'
    or deal_row.deal_status is distinct from 'reviewing'
    or deal_row.payment_status is distinct from 'unpaid'
    or deal_row.payment_confirmed is distinct from false
    or deal_row.amount_paid is distinct from 0
    or deal_row.currency is distinct from 'USD' then
    raise exception 'INTAKE_REVIEW_RECEIPT_INVALID' using errcode = '22023';
  end if;

  insert into public.deals as inserted (
    deal_id, access_token, client_name, client_type,
    company_name, email, phone, document_type,
    use_case, destination_country, origin_state, apostille_required,
    execution_truth, customer_execution_preference, docs_count, urgency,
    mobile, miles, signers, witnesses,
    witness_type, after_hours, translation, multi_country,
    payment_status, payment_confirmed, amount_paid, currency,
    status, deal_status, conversion_score, priority_tier,
    notes, internal_notes, professional_profile_id, referral_source_type,
    referral_source_id, referral_reference
  )
  select
    d.deal_id, d.access_token, d.client_name, d.client_type,
    d.company_name, d.email, d.phone, d.document_type,
    d.use_case, d.destination_country, d.origin_state, d.apostille_required,
    d.execution_truth, d.customer_execution_preference, d.docs_count, d.urgency,
    d.mobile, d.miles, d.signers, d.witnesses,
    d.witness_type, d.after_hours, d.translation, d.multi_country,
    d.payment_status, d.payment_confirmed, d.amount_paid, d.currency,
    d.status, d.deal_status, d.conversion_score, d.priority_tier,
    d.notes, d.internal_notes, d.professional_profile_id, d.referral_source_type,
    d.referral_source_id, d.referral_reference
  from (select (deal_row).*) d
  returning inserted.id, inserted.deal_id into saved_id, saved_deal_id;

  if saved_id is null or saved_deal_id is distinct from deal_row.deal_id
    or public.complete_intake_submission(
      p_token_hash, p_payload_hash, 200, p_response_body, saved_deal_id
    ) is distinct from true then
    raise exception 'INTAKE_REVIEW_RECEIPT_NOT_SAVED';
  end if;
  return query select saved_id, saved_deal_id;
end;
$$;

revoke all on function public.persist_review_intake_receipt(text, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.persist_review_intake_receipt(text, text, jsonb, jsonb)
  to service_role;

commit;
