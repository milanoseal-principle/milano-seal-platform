begin;

-- The canonical Wise link is generated locally. The payment row is the durable
-- operation and the Matter mirror is committed in the same transaction.
create function public.issue_approved_retainer_instruction(
  p_matter_id uuid, p_quote_approved_at timestamptz, p_amount numeric,
  p_reference text, p_url text, p_description text
)
returns table(payment_url text, reference text, amount numeric, currency text,
              description text, payment_status text, existing boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  d public.deals;
  p public.payments;
  row_count integer;
begin
  select * into d from public.deals where id = p_matter_id for update;
  if not found then raise exception 'MATTER_NOT_FOUND' using errcode = 'P0002'; end if;

  if d.status is distinct from 'awaiting_payment'
    or d.quote_review_required is distinct from false
    or d.quote_approved_at is null or d.quote_approved_at is distinct from p_quote_approved_at
    or nullif(btrim(d.quote_approved_by), '') is null
    or nullif(d.execution_truth->>'review_confirmed_by', '') is null
    or nullif(d.execution_truth->>'review_confirmed_at', '') is null
    or not exists (
      select 1 from public.matter_evidence_ledger e where e.matter_id = d.id
        and e.event_type = 'canonical_quote_approved' and e.source = 'operator_quote_builder'
        and e.occurred_at = d.quote_approved_at
    )
    or d.payment_disposition is distinct from 'standard_payment'
    or d.payment_status is distinct from 'unpaid' or d.payment_confirmed is distinct from false
    or coalesce(d.amount_paid, 0) <> 0
    or d.payment_observed_at is not null or d.payment_attempt_id is not null
    or nullif(btrim(d.wise_transaction_reference), '') is not null
    or d.currency is distinct from 'USD'
    or d.final_total is null or d.final_total <= 0
    or d.final_total::text in ('NaN', 'Infinity', '-Infinity')
    or d.total_price is distinct from d.final_total
    or round(d.final_total, 2) is distinct from d.final_total
    or d.invoice_retainer is distinct from round(d.final_total / 2, 2)
    or d.invoice_balance is distinct from d.final_total - d.invoice_retainer
    or d.amount_due is distinct from d.invoice_retainer
    or p_amount is distinct from d.amount_due
    or d.deal_id is null or p_reference is distinct from d.deal_id || '-R'
    or p_url is null or p_url !~ '^https://(www[.])?(wise[.]com|transferwise[.]com)/'
    or nullif(btrim(p_description), '') is null then
    raise exception 'APPROVED_RETAINER_REQUIRED' using errcode = '22023';
  end if;

  select count(*) into row_count from public.payments r
  where r.matter_id = d.id and r.payment_type = 'retainer';
  if row_count > 0 then
    select * into p from public.payments r
    where r.matter_id = d.id and r.payment_type = 'retainer'
    order by r.id limit 1 for update;
    if row_count <> 1 or p.payment_status is distinct from 'awaiting_payment'
      or p.payment_confirmed is distinct from false
      or p.payment_amount is distinct from d.amount_due
      or p.payment_currency is distinct from d.currency
      or p.wise_reference is distinct from p_reference
      or nullif(p.wise_payment_url, '') is null
      or p.wise_payment_url !~ '^https://(www[.])?(wise[.]com|transferwise[.]com)/'
      or d.wise_reference is distinct from p.wise_reference
      or d.payment_link is distinct from p.wise_payment_url then
      raise exception 'RETAINER_RECONCILIATION_REQUIRED' using errcode = '22023';
    end if;
    return query select p.wise_payment_url, p.wise_reference, p.payment_amount,
      p.payment_currency, p.payment_description, p.payment_status, true;
    return;
  end if;

  if (d.payment_link is not null and d.payment_link <> p_url)
    or (d.wise_reference is not null and d.wise_reference not in (d.deal_id, p_reference))
    or exists (select 1 from public.payments r where r.wise_reference = p_reference) then
    raise exception 'RETAINER_RECONCILIATION_REQUIRED' using errcode = '22023';
  end if;

  insert into public.payments (
    matter_id, wise_payment_url, wise_reference, payment_type, payment_amount,
    payment_currency, payment_description, payment_status, payer_name, payer_email
  ) values (
    d.id, p_url, p_reference, 'retainer', d.amount_due, d.currency,
    p_description, 'awaiting_payment', d.client_name, d.email
  ) returning * into p;

  update public.deals set wise_reference = p.wise_reference, payment_link = p.wise_payment_url
  where id = d.id;

  return query select p.wise_payment_url, p.wise_reference, p.payment_amount,
    p.payment_currency, p.payment_description, p.payment_status, false;
end;
$$;

revoke all on function public.issue_approved_retainer_instruction(uuid,timestamptz,numeric,text,text,text)
  from public, anon, authenticated;
grant execute on function public.issue_approved_retainer_instruction(uuid,timestamptz,numeric,text,text,text)
  to service_role;

commit;
