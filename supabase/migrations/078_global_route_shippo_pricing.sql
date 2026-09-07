-- Migration 078: Global route + Shippo quote pricing continuity
-- One Matter, one selected provider shipment, one pricing authority.

alter table public.deals
  add column if not exists shipping_street1 text,
  add column if not exists shipping_street2 text,
  add column if not exists shipping_city text,
  add column if not exists shipping_state text,
  add column if not exists shipping_zip text,
  add column if not exists shipping_country text,
  add column if not exists courier_required boolean not null default false,
  add column if not exists authentication_route text,
  add column if not exists authentication_route_status text not null default 'review_required',
  add column if not exists courier_pricing_status text not null default 'not_required',
  add column if not exists courier_shippo_shipment_id text,
  add column if not exists courier_shippo_rate_id text,
  add column if not exists courier_carrier text,
  add column if not exists courier_service_level text,
  add column if not exists courier_provider_rate numeric(12,2),
  add column if not exists courier_tier_credit numeric(12,2) not null default 0,
  add column if not exists courier_client_charge numeric(12,2) not null default 0,
  add column if not exists courier_currency text not null default 'USD',
  add column if not exists courier_estimated_days integer,
  add column if not exists courier_rate_selected_at timestamptz;

alter table public.deals
  drop constraint if exists deals_authentication_route_status_check,
  add constraint deals_authentication_route_status_check
    check (authentication_route_status in ('ready','review_required','pending_authority_confirmation','not_required')),
  drop constraint if exists deals_courier_pricing_status_check,
  add constraint deals_courier_pricing_status_check
    check (courier_pricing_status in ('not_required','address_required','rate_required','rate_selected','adjustment_required','locked')),
  drop constraint if exists deals_courier_amounts_check,
  add constraint deals_courier_amounts_check
    check (
      courier_tier_credit >= 0
      and courier_client_charge >= 0
      and (courier_provider_rate is null or courier_provider_rate >= 0)
    );

alter table public.shippo_shipments
  add column if not exists provider_rate_amount numeric(12,2),
  add column if not exists tier_courier_credit numeric(12,2) not null default 0,
  add column if not exists client_courier_charge numeric(12,2) not null default 0,
  add column if not exists estimated_days integer,
  add column if not exists rate_selected_at timestamptz;

create unique index if not exists ux_shippo_shipments_shippo_shipment_id
  on public.shippo_shipments(shippo_shipment_id)
  where shippo_shipment_id is not null;

create index if not exists idx_deals_courier_pricing_status
  on public.deals(courier_pricing_status);

create index if not exists idx_deals_authentication_route
  on public.deals(authentication_route);

comment on column public.deals.authentication_route is
  'Derived from the existing Milano global-acceptance authority; this field is a persisted route decision, not a second routing engine.';
comment on column public.deals.courier_provider_rate is
  'Observed Shippo provider rate before Milano tier courier credit.';
comment on column public.deals.courier_tier_credit is
  'Milano tier benefit only; never overwrite the observed Shippo provider rate.';
comment on column public.deals.courier_client_charge is
  'Client courier charge after tier credit; included in non_discountable_total.';

create or replace function public.apply_shippo_rate_to_matter(
  p_matter_id uuid,
  p_shippo_shipment_id text,
  p_shippo_rate_id text,
  p_carrier text,
  p_service_level text,
  p_provider_rate numeric,
  p_tier_credit numeric,
  p_client_charge numeric,
  p_currency text,
  p_estimated_days integer,
  p_actor_id uuid,
  p_address_from jsonb default '{}'::jsonb,
  p_address_to jsonb default '{}'::jsonb,
  p_parcel jsonb default '{}'::jsonb,
  p_customs_declaration_id text default null,
  p_customs_required boolean default false
)
returns table (
  matter_id uuid,
  final_total numeric,
  invoice_retainer numeric,
  invoice_balance numeric,
  amount_due numeric,
  courier_client_charge numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matter public.deals%rowtype;
  v_existing_courier numeric(12,2);
  v_other_non_discountable numeric(12,2);
  v_non_discountable numeric(12,2);
  v_eligible numeric(12,2);
  v_original numeric(12,2);
  v_discount numeric(12,2);
  v_final numeric(12,2);
  v_prior_final numeric(12,2);
  v_ratio numeric;
  v_retainer numeric(12,2);
  v_balance numeric(12,2);
begin
  if p_shippo_shipment_id is null or btrim(p_shippo_shipment_id) = '' then
    raise exception 'SHIPPO_SHIPMENT_REQUIRED';
  end if;
  if p_shippo_rate_id is null or btrim(p_shippo_rate_id) = '' then
    raise exception 'SHIPPO_RATE_REQUIRED';
  end if;
  if upper(coalesce(p_currency, '')) <> 'USD' then
    raise exception 'COURIER_CURRENCY_REVIEW_REQUIRED';
  end if;
  if p_provider_rate < 0 or p_tier_credit < 0 or p_client_charge < 0 then
    raise exception 'INVALID_COURIER_AMOUNT';
  end if;
  if abs(p_provider_rate - (p_tier_credit + p_client_charge)) > 0.009 then
    raise exception 'COURIER_AMOUNT_INTEGRITY_FAILED';
  end if;

  select * into v_matter
  from public.deals
  where id = p_matter_id
  for update;

  if not found then
    raise exception 'MATTER_NOT_FOUND';
  end if;

  if v_matter.payment_observed_at is not null
     or coalesce(v_matter.payment_confirmed, false)
     or lower(coalesce(v_matter.payment_status, 'unpaid')) in ('paid','confirmed','payment_confirmed','deposit_paid') then
    raise exception 'COURIER_PRICING_LOCKED_AFTER_WISE_SUBMISSION';
  end if;

  if exists (
    select 1 from public.payments p
    where p.matter_id = p_matter_id
      and p.payment_status in ('payment_pending','payment_confirmed')
  ) then
    raise exception 'COURIER_PRICING_LOCKED_AFTER_WISE_SUBMISSION';
  end if;

  v_existing_courier := coalesce(v_matter.courier_client_charge, 0);
  v_other_non_discountable := greatest(coalesce(v_matter.non_discountable_total, 0) - v_existing_courier, 0);
  v_non_discountable := round(v_other_non_discountable + p_client_charge, 2);
  v_eligible := coalesce(
    v_matter.eligible_subtotal,
    greatest(coalesce(v_matter.original_total, v_matter.total_price, 0) - coalesce(v_matter.non_discountable_total, 0), 0)
  );
  v_original := round(v_eligible + v_non_discountable, 2);
  v_discount := greatest(coalesce(v_matter.discount_amount, 0), 0);
  v_final := round(greatest(v_original - least(v_discount, v_eligible), 0), 2);
  v_prior_final := coalesce(v_matter.final_total, v_matter.total_price, 0);

  if coalesce(v_matter.invoice_balance, 0) > 0 and v_prior_final > 0 then
    v_ratio := least(1, greatest(0, coalesce(v_matter.invoice_retainer, 0) / v_prior_final));
  else
    v_ratio := 1;
  end if;

  v_retainer := round(v_final * v_ratio, 2);
  v_balance := round(v_final - v_retainer, 2);

  delete from public.payments
  where matter_id = p_matter_id
    and payment_status = 'awaiting_payment';

  insert into public.shippo_shipments (
    matter_id,
    shippo_shipment_id,
    shippo_rate_id,
    carrier,
    service_level,
    courier_status,
    address_from,
    address_to,
    parcel,
    customs_declaration_id,
    customs_required,
    provider_rate_amount,
    tier_courier_credit,
    client_courier_charge,
    shippo_currency,
    estimated_days,
    rate_selected_at,
    created_by,
    updated_at
  ) values (
    p_matter_id,
    p_shippo_shipment_id,
    p_shippo_rate_id,
    p_carrier,
    p_service_level,
    'RATE_SELECTED',
    coalesce(p_address_from, '{}'::jsonb),
    coalesce(p_address_to, '{}'::jsonb),
    coalesce(p_parcel, '{}'::jsonb),
    p_customs_declaration_id,
    coalesce(p_customs_required, false),
    p_provider_rate,
    p_tier_credit,
    p_client_charge,
    upper(p_currency),
    p_estimated_days,
    now(),
    p_actor_id,
    now()
  )
  on conflict (shippo_shipment_id) where shippo_shipment_id is not null
  do update set
    matter_id = excluded.matter_id,
    shippo_rate_id = excluded.shippo_rate_id,
    carrier = excluded.carrier,
    service_level = excluded.service_level,
    courier_status = 'RATE_SELECTED',
    address_from = excluded.address_from,
    address_to = excluded.address_to,
    parcel = excluded.parcel,
    customs_declaration_id = excluded.customs_declaration_id,
    customs_required = excluded.customs_required,
    provider_rate_amount = excluded.provider_rate_amount,
    tier_courier_credit = excluded.tier_courier_credit,
    client_courier_charge = excluded.client_courier_charge,
    shippo_currency = excluded.shippo_currency,
    estimated_days = excluded.estimated_days,
    rate_selected_at = now(),
    updated_at = now();

  update public.deals
  set
    courier_required = true,
    courier_pricing_status = 'rate_selected',
    courier_shippo_shipment_id = p_shippo_shipment_id,
    courier_shippo_rate_id = p_shippo_rate_id,
    courier_carrier = p_carrier,
    courier_service_level = p_service_level,
    courier_provider_rate = p_provider_rate,
    courier_tier_credit = p_tier_credit,
    courier_client_charge = p_client_charge,
    courier_currency = upper(p_currency),
    courier_estimated_days = p_estimated_days,
    courier_rate_selected_at = now(),
    non_discountable_total = v_non_discountable,
    original_total = v_original,
    final_total = v_final,
    total_price = v_final,
    final_price = v_final,
    invoice_subtotal = v_final,
    invoice_retainer = v_retainer,
    invoice_balance = v_balance,
    amount_due = v_retainer,
    payment_link = null,
    balance_payment_link = null,
    wise_payment_id = null,
    wise_transfer_id = null,
    updated_at = now()
  where id = p_matter_id;

  return query
  select p_matter_id, v_final, v_retainer, v_balance, v_retainer, p_client_charge;
end;
$$;

revoke all on function public.apply_shippo_rate_to_matter(uuid,text,text,text,text,numeric,numeric,numeric,text,integer,uuid,jsonb,jsonb,jsonb,text,boolean) from public;
grant execute on function public.apply_shippo_rate_to_matter(uuid,text,text,text,text,numeric,numeric,numeric,text,integer,uuid,jsonb,jsonb,jsonb,text,boolean) to service_role;
