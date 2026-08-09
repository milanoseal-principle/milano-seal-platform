begin;
alter table public.deals
  add column if not exists discount_code text,
  add column if not exists discount_value numeric(12,2),
  add column if not exists eligible_subtotal numeric(12,2),
  add column if not exists non_discountable_total numeric(12,2) not null default 0,
  add column if not exists original_total numeric(12,2),
  add column if not exists final_total numeric(12,2),
  add column if not exists wise_transaction_reference text;
create index if not exists idx_deals_discount_code on public.deals(upper(discount_code));
create index if not exists idx_deals_wise_reference on public.deals(wise_reference);

create or replace function public.redeem_discount_for_matter(p_discount_code_id uuid,p_matter_id uuid,p_payment_reference text,p_wise_transaction_reference text,p_currency text,p_created_by text default 'wise-webhook') returns uuid language plpgsql security definer set search_path=public as $$
declare v_code public.discount_codes%rowtype; v_deal public.deals%rowtype; v_existing uuid; v_redemption uuid;
begin
  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
  select id into v_existing from public.discount_redemptions where discount_code_id=p_discount_code_id and matter_id=p_matter_id and status='redeemed' limit 1;
  if v_existing is not null then return v_existing; end if;
  select * into v_code from public.discount_codes where id=p_discount_code_id for update;
  if not found then raise exception 'discount_code_not_found'; end if;
  if v_code.status <> 'active' then raise exception 'discount_code_not_active'; end if;
  if v_code.starts_at is not null and v_code.starts_at > now() then raise exception 'discount_code_not_started'; end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then raise exception 'discount_code_expired'; end if;
  if v_code.usage_limit is not null and v_code.usage_count >= v_code.usage_limit then raise exception 'discount_code_exhausted'; end if;
  select * into v_deal from public.deals where id=p_matter_id for update;
  if not found then raise exception 'matter_not_found'; end if;
  if upper(coalesce(v_deal.discount_code,'')) <> upper(v_code.code) then raise exception 'discount_not_attached_to_matter'; end if;
  if v_deal.eligible_subtotal is null then raise exception 'eligible_subtotal_missing'; end if;
  insert into public.discount_redemptions(discount_code_id,matter_id,client_id,payment_reference,wise_transaction_reference,eligible_subtotal,discount_amount,currency,status,redeemed_at,created_by,metadata)
  values(v_code.id,v_deal.id,null,p_payment_reference,p_wise_transaction_reference,v_deal.eligible_subtotal,coalesce(v_deal.discount_amount,0),upper(trim(p_currency)),'redeemed',now(),p_created_by,jsonb_build_object('source','confirmed_wise_reconciliation')) returning id into v_redemption;
  update public.discount_codes set usage_count=usage_count+1,status=case when usage_limit is not null and usage_count+1>=usage_limit then 'exhausted' else status end,updated_at=now() where id=v_code.id;
  return v_redemption;
end $$;
revoke all on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) to service_role;

create or replace function public.confirm_wise_payment_for_deal(p_deal_id uuid,p_payment_reference text,p_wise_transaction_reference text,p_amount numeric,p_currency text,p_actor text default 'wise-webhook') returns jsonb language plpgsql security definer set search_path=public as $$
declare v_deal public.deals%rowtype; v_discount_id uuid; v_redemption_id uuid; v_expected_currency text;
begin
  if p_amount is null or p_amount<=0 then raise exception 'invalid_payment_amount'; end if;
  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then raise exception 'invalid_payment_currency'; end if;
  select * into v_deal from public.deals where id=p_deal_id for update;
  if not found then raise exception 'matter_not_found'; end if;
  if v_deal.payment_status='paid' and v_deal.payment_confirmed=true then return jsonb_build_object('confirmed',true,'already_confirmed',true,'redemption_id',null); end if;
  if v_deal.amount_due is null or v_deal.amount_due<=0 then raise exception 'amount_due_missing'; end if;
  if round(p_amount*100) <> round(v_deal.amount_due*100) then raise exception 'payment_amount_mismatch'; end if;
  v_expected_currency:=upper(coalesce(nullif(trim(v_deal.currency),''),'USD'));
  if upper(trim(p_currency)) <> v_expected_currency then raise exception 'payment_currency_mismatch'; end if;
  if p_payment_reference is null or trim(p_payment_reference)='' then raise exception 'payment_reference_missing'; end if;
  if coalesce(v_deal.wise_reference,v_deal.deal_id) <> trim(p_payment_reference) then raise exception 'payment_reference_mismatch'; end if;
  if nullif(trim(coalesce(v_deal.discount_code,'')),'') is not null then
    select id into v_discount_id from public.discount_codes where upper(code)=upper(v_deal.discount_code) limit 1;
    if v_discount_id is null then raise exception 'attached_discount_not_found'; end if;
    v_redemption_id:=public.redeem_discount_for_matter(v_discount_id,v_deal.id,trim(p_payment_reference),p_wise_transaction_reference,upper(trim(p_currency)),p_actor);
  end if;
  update public.deals set payment_status='paid',payment_confirmed=true,payment_method='wise',payment_reference=trim(p_payment_reference),wise_transaction_reference=p_wise_transaction_reference,payment_amount_received=p_amount,amount_paid=p_amount,payment_confirmed_at=now(),payment_settlement_status='cleared',payment_cleared_at=now(),payment_funding_method='wise',updated_at=now() where id=v_deal.id;
  return jsonb_build_object('confirmed',true,'already_confirmed',false,'redemption_id',v_redemption_id);
end $$;
revoke all on function public.confirm_wise_payment_for_deal(uuid,text,text,numeric,text,text) from public,anon,authenticated;
grant execute on function public.confirm_wise_payment_for_deal(uuid,text,text,numeric,text,text) to service_role;
commit;
