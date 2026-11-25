-- Shipment-leg label reconciliation bound to the exact purchase attempt.
--
-- Additive only. record_shipment_leg_label is unchanged. Reconciliation of an
-- ambiguous purchase (outcome unknown) must apply ONLY to the attempt the
-- operator's provider evidence was gathered for. The attempt is identified by
-- the leg's updated_at at claim time (set by the existing updated_at trigger
-- when claim_shipment_leg_label moves the leg to purchase_pending; the row is
-- not otherwise written while pending). The comparison happens under the same
-- row lock as the write, so two concurrent reconcilers cannot both act: the
-- second sees a changed attempt and is refused, and a new purchase claimed in
-- between can never be unlocked by stale evidence.

create or replace function public.reconcile_shipment_leg_label(
  p_matter_id uuid,
  p_leg_id uuid,
  p_expected_claimed_at timestamptz,
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
  if p_expected_claimed_at is null or v_leg.updated_at <> p_expected_claimed_at then
    raise exception using errcode = '40001', message = 'RECONCILE_ATTEMPT_CHANGED';
  end if;

  -- Same transaction; the row lock above is held through the write.
  return query select * from public.record_shipment_leg_label(
    p_matter_id, p_leg_id, p_success, p_transaction_id, p_tracking_number,
    coalesce(p_evidence, '{}'::jsonb) || jsonb_build_object('reconciled_attempt_claimed_at', p_expected_claimed_at),
    p_actor_id
  );
end;
$$;

revoke all on function public.reconcile_shipment_leg_label(uuid, uuid, timestamptz, boolean, text, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.reconcile_shipment_leg_label(uuid, uuid, timestamptz, boolean, text, text, jsonb, uuid) to service_role;
