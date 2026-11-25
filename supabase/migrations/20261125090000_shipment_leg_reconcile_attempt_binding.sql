-- Shipment-leg label reconciliation bound to the exact purchase attempt.
--
-- Additive only: existing RPCs (claim/record/void/rate/tracking) are
-- unchanged. Every purchase claim gets an immutable attempt identity:
-- label_claim_id + label_claimed_at, set by a trigger ONLY on the transition
-- into purchase_pending. No other write (tracking webhooks, evidence updates)
-- can change them, unlike updated_at. Reconciliation of an ambiguous purchase
-- must name the attempt its provider evidence was gathered for; the
-- comparison runs under the same row lock as the write, so concurrent or
-- stale reconcilers can never unlock a newer attempt.

alter table public.matter_shipment_legs
  add column if not exists label_claim_id uuid,
  add column if not exists label_claimed_at timestamptz;

-- Backfill BEFORE the trigger exists: legs already pending when this ships
-- get an identity from their last write. (Run after the trigger, the
-- immutability branch would write the old NULLs straight back.)
update public.matter_shipment_legs
set label_claim_id = gen_random_uuid(), label_claimed_at = updated_at
where label_status = 'purchase_pending' and label_claim_id is null;

create or replace function public.stamp_shipment_leg_label_claim()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.label_status = 'purchase_pending' and old.label_status is distinct from 'purchase_pending' then
    new.label_claim_id := gen_random_uuid();
    new.label_claimed_at := clock_timestamp();
  elsif new.label_status = 'purchase_pending' and old.label_claim_id is not null then
    -- While pending, a stamped attempt identity is immutable.
    new.label_claim_id := old.label_claim_id;
    new.label_claimed_at := old.label_claimed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists matter_shipment_legs_label_claim on public.matter_shipment_legs;
create trigger matter_shipment_legs_label_claim
  before update on public.matter_shipment_legs
  for each row execute function public.stamp_shipment_leg_label_claim();

create or replace function public.reconcile_shipment_leg_label(
  p_matter_id uuid,
  p_leg_id uuid,
  p_expected_claim_id uuid,
  p_success boolean,
  p_transaction_id text,
  p_tracking_number text,
  p_evidence jsonb,
  p_actor_id uuid
)
returns setof public.matter_shipment_legs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg public.matter_shipment_legs%rowtype;
begin
  select * into v_leg from public.matter_shipment_legs where id = p_leg_id for update;
  if not found or v_leg.matter_id <> p_matter_id then
    raise exception using errcode = 'P0002', message = 'SHIPMENT_LEG_NOT_FOUND';
  end if;
  if v_leg.label_status <> 'purchase_pending' then
    raise exception using errcode = '22023', message = 'LABEL_PURCHASE_NOT_PENDING';
  end if;
  if p_expected_claim_id is null or v_leg.label_claim_id is distinct from p_expected_claim_id then
    raise exception using errcode = '40001', message = 'RECONCILE_ATTEMPT_CHANGED';
  end if;

  -- Same transaction; the row lock above is held through the write.
  return query select * from public.record_shipment_leg_label(
    p_matter_id, p_leg_id, p_success, p_transaction_id, p_tracking_number,
    coalesce(p_evidence, '{}'::jsonb) || jsonb_build_object(
      'reconciled_claim_id', p_expected_claim_id,
      'reconciled_claimed_at', v_leg.label_claimed_at),
    p_actor_id
  );
end;
$$;

revoke all on function public.stamp_shipment_leg_label_claim() from public, anon, authenticated;
revoke all on function public.reconcile_shipment_leg_label(uuid, uuid, uuid, boolean, text, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.reconcile_shipment_leg_label(uuid, uuid, uuid, boolean, text, text, jsonb, uuid) to service_role;
