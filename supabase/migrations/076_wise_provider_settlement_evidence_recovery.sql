-- Governed Wise provider settlement evidence recovery.
--
-- Purpose: recover a settled Wise acquiring payment when Wise's activity or
-- balance-statement payload omits the Milano Matter reference even though an
-- official Wise provider notification supplies the exact acquiring resource,
-- amount, currency and settled payout evidence.
--
-- This does NOT create another payment authority. It records immutable
-- provider evidence and delegates the paid-state mutation to the existing
-- canonical confirm_wise_payment_for_deal(...) function.

create table if not exists public.wise_provider_settlement_evidence (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete restrict,
  payment_reference text not null,
  provider_resource_id text not null unique,
  provider_event_type text not null default 'ACQUIRING_TRANSACTION',
  gross_amount numeric(12,2) not null check (gross_amount > 0),
  net_amount numeric(12,2) not null check (net_amount >= 0),
  fee_amount numeric(12,2) not null check (fee_amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  settled_at timestamptz not null,
  evidence_source text not null default 'wise_provider_notification'
    check (evidence_source = 'wise_provider_notification'),
  evidence_locator text not null,
  recorded_by text not null,
  confirmation_result jsonb null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz null,
  constraint wise_provider_resource_uuid_check check (
    provider_resource_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  constraint wise_provider_amount_math_check check (
    abs((net_amount + fee_amount) - gross_amount) <= 0.01
  )
);

create index if not exists wise_provider_settlement_evidence_deal_idx
  on public.wise_provider_settlement_evidence(deal_id, settled_at desc);

alter table public.wise_provider_settlement_evidence enable row level security;
revoke all on public.wise_provider_settlement_evidence from anon, authenticated;
grant select, insert, update on public.wise_provider_settlement_evidence to service_role;

create or replace function public.confirm_wise_payment_from_provider_notification(
  p_deal_id uuid,
  p_payment_reference text,
  p_provider_resource_id text,
  p_gross_amount numeric,
  p_net_amount numeric,
  p_fee_amount numeric,
  p_currency text,
  p_settled_at timestamptz,
  p_evidence_locator text,
  p_actor text default 'wise-provider-notification-recovery'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deal public.deals%rowtype;
  v_existing public.wise_provider_settlement_evidence%rowtype;
  v_evidence public.wise_provider_settlement_evidence%rowtype;
  v_reference text;
  v_currency text;
  v_result jsonb;
begin
  select * into v_deal
  from public.deals
  where id = p_deal_id
  for update;

  if not found then
    raise exception 'MATTER_NOT_FOUND';
  end if;

  v_reference := trim(coalesce(v_deal.wise_reference, v_deal.deal_id, ''));
  v_currency := upper(trim(coalesce(v_deal.currency, 'USD')));

  if v_reference = '' or trim(coalesce(p_payment_reference, '')) <> v_reference then
    raise exception 'WISE_REFERENCE_MISMATCH';
  end if;

  if upper(trim(coalesce(p_currency, ''))) <> v_currency then
    raise exception 'WISE_CURRENCY_MISMATCH';
  end if;

  if round(coalesce(p_gross_amount, 0)::numeric, 2) <> round(coalesce(v_deal.amount_due, 0)::numeric, 2) then
    raise exception 'WISE_AMOUNT_MISMATCH';
  end if;

  if abs(round((coalesce(p_net_amount, 0) + coalesce(p_fee_amount, 0))::numeric, 2) - round(coalesce(p_gross_amount, 0)::numeric, 2)) > 0.01 then
    raise exception 'WISE_PROVIDER_AMOUNT_MATH_MISMATCH';
  end if;

  if coalesce(p_provider_resource_id, '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'WISE_PROVIDER_RESOURCE_INVALID';
  end if;

  if p_settled_at is null or p_settled_at > now() + interval '10 minutes' then
    raise exception 'WISE_SETTLEMENT_TIMESTAMP_INVALID';
  end if;

  if v_deal.payment_observed_at is null then
    raise exception 'WISE_SUBMISSION_NOT_OBSERVED';
  end if;

  if p_settled_at < v_deal.payment_observed_at - interval '15 minutes' then
    raise exception 'WISE_SETTLEMENT_PRECEDES_SUBMISSION';
  end if;

  select * into v_existing
  from public.wise_provider_settlement_evidence
  where provider_resource_id = p_provider_resource_id;

  if found and v_existing.deal_id <> p_deal_id then
    raise exception 'WISE_PROVIDER_RESOURCE_ALREADY_BOUND';
  end if;

  insert into public.wise_provider_settlement_evidence (
    deal_id,
    payment_reference,
    provider_resource_id,
    gross_amount,
    net_amount,
    fee_amount,
    currency,
    settled_at,
    evidence_source,
    evidence_locator,
    recorded_by
  ) values (
    p_deal_id,
    v_reference,
    p_provider_resource_id,
    round(p_gross_amount::numeric, 2),
    round(p_net_amount::numeric, 2),
    round(p_fee_amount::numeric, 2),
    v_currency,
    p_settled_at,
    'wise_provider_notification',
    left(trim(coalesce(p_evidence_locator, '')), 500),
    left(trim(coalesce(nullif(p_actor, ''), 'wise-provider-notification-recovery')), 200)
  )
  on conflict (provider_resource_id) do update
    set evidence_locator = excluded.evidence_locator,
        recorded_by = excluded.recorded_by
  returning * into v_evidence;

  -- Canonical authority remains here. This recovery function never writes
  -- payment_status/payment_confirmed/amount_paid itself.
  v_result := public.confirm_wise_payment_for_deal(
    p_deal_id,
    v_reference,
    p_provider_resource_id,
    round(p_gross_amount::numeric, 2),
    v_currency,
    left(trim(coalesce(nullif(p_actor, ''), 'wise-provider-notification-recovery')), 200)
  );

  update public.wise_provider_settlement_evidence
  set confirmation_result = v_result,
      confirmed_at = now()
  where id = v_evidence.id;

  return jsonb_build_object(
    'ok', true,
    'deal_id', p_deal_id,
    'payment_reference', v_reference,
    'provider_resource_id', p_provider_resource_id,
    'evidence_id', v_evidence.id,
    'canonical_confirmation', v_result
  );
end;
$$;

revoke all on function public.confirm_wise_payment_from_provider_notification(uuid,text,text,numeric,numeric,numeric,text,timestamptz,text,text)
  from public, anon, authenticated;
grant execute on function public.confirm_wise_payment_from_provider_notification(uuid,text,text,numeric,numeric,numeric,text,timestamptz,text,text)
  to service_role;
