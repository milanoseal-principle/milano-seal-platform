-- Shipment-leg tracking isolated to the leg's CURRENT purchased label.
--
-- Additive only: record_shipment_leg_tracking is unchanged. After a void (and
-- while a replacement is rate-selected, pending or newly created), the leg can
-- still match carrier events for the OLD label by its retained tracking number
-- or transaction id. Those events must never become current custody authority:
-- a new label does not inherit carrier possession from a voided one, and a late
-- old-label event must not move a newer purchase attempt's custody.
--
-- This wrapper locks the leg and forwards an event to the existing tracking
-- RPC only when it belongs to the label the leg currently holds (label_status
-- 'created' and every identifier the event carries matches the leg's current
-- tracking number / provider transaction). Any other event is preserved in
-- shippo_tracking_events under the EVENT's own identifiers (history is never
-- erased) and changes nothing on the leg. Idempotency is unchanged (event_hash).

create or replace function public.record_shipment_leg_label_tracking(
  p_matter_id uuid,
  p_leg_id uuid,
  p_event_hash text,
  p_status text,
  p_substatus text,
  p_status_details text,
  p_status_date timestamptz,
  p_carrier text,
  p_raw jsonb,
  p_event_tracking_number text,
  p_event_transaction_id text
)
returns table (outcome text, custody_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg public.matter_shipment_legs%rowtype;
  v_tracking text := nullif(btrim(coalesce(p_event_tracking_number, '')), '');
  v_transaction text := nullif(btrim(coalesce(p_event_transaction_id, '')), '');
  v_current boolean;
  v_inserted uuid;
begin
  if coalesce(p_event_hash, '') = '' then
    raise exception using errcode = '22023', message = 'EVENT_HASH_REQUIRED';
  end if;
  select * into v_leg from public.matter_shipment_legs where id = p_leg_id for update;
  if not found or v_leg.matter_id <> p_matter_id then
    raise exception using errcode = 'P0002', message = 'SHIPMENT_LEG_NOT_FOUND';
  end if;

  v_current :=
    v_leg.label_status = 'created'
    and (v_tracking is not null or v_transaction is not null)
    and (v_tracking is null or v_tracking = v_leg.tracking_number)
    and (v_transaction is null or v_transaction = v_leg.provider_transaction_id);

  if v_current then
    -- Same transaction; the row lock above is held through the existing RPC.
    return query select * from public.record_shipment_leg_tracking(
      p_matter_id, p_leg_id, p_event_hash, p_status, p_substatus, p_status_details,
      p_status_date, p_carrier, p_raw
    );
    return;
  end if;

  -- Not the current label: preserve the event as history under its own
  -- identifiers; no custody, status, timestamp or evidence change on the leg.
  insert into public.shippo_tracking_events (
    matter_id, shippo_shipment_id, shippo_transaction_id, carrier, tracking_number, status,
    substatus_code, status_details, status_date, raw_event, event_hash
  ) values (
    p_matter_id, null, v_transaction, p_carrier, v_tracking,
    upper(coalesce(p_status, '')), p_substatus, p_status_details, p_status_date,
    coalesce(p_raw, '{}'::jsonb) || jsonb_build_object('isolated', 'not_current_label', 'leg_id', p_leg_id),
    p_event_hash
  ) on conflict (event_hash) do nothing
  returning id into v_inserted;

  return query select
    case when v_inserted is null then 'duplicate' else 'isolated_not_current_label' end::text,
    v_leg.custody_status;
end;
$$;

revoke all on function public.record_shipment_leg_label_tracking(uuid, uuid, text, text, text, text, timestamptz, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.record_shipment_leg_label_tracking(uuid, uuid, text, text, text, text, timestamptz, text, jsonb, text, text) to service_role;
