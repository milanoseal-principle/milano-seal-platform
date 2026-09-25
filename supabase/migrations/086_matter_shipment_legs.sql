begin;

-- 086_matter_shipment_legs.sql
-- Matter-linked physical logistics legs over the EXISTING Shippo + custody
-- architecture. Additive. This is logistics evidence only: the custody ledger
-- stays the canonical custody history, the Matter state machine stays the only
-- lifecycle, and no leg event ever completes or releases a Matter.
--
-- Reused, not replaced: lib/shippo client, approved-carrier policy, governed
-- rate ranking, HMAC-verified courier webhook, shippo_tracking_events
-- (event_hash idempotency), custody_ledger hash chain (same pattern as 074),
-- matter_evidence_ledger.

create table if not exists public.matter_shipment_legs (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete cascade,
  shipment_record_id uuid references public.shippo_shipments(id) on delete set null,
  provider text not null default 'shippo',
  provider_shipment_id text,
  provider_transaction_id text,
  leg_type text not null,
  sequence integer not null,
  direction text not null,
  origin_json jsonb not null,
  destination_json jsonb not null,
  rate_snapshot jsonb,
  carrier text,
  service_level text,
  label_status text not null default 'not_created',
  tracking_number text,
  tracking_status text,
  custody_status text not null default 'not_started',
  provider_evidence jsonb not null default '{}'::jsonb,
  exception_reason text,
  label_created_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matter_shipment_legs_provider_check check (provider in ('shippo')),
  constraint matter_shipment_legs_sequence_check check (sequence >= 1),
  constraint matter_shipment_legs_leg_type_check check (
    leg_type in ('outbound_to_authority', 'return_from_authority', 'final_to_client', 'final_international', 'exception_return')
  ),
  constraint matter_shipment_legs_direction_check check (
    (leg_type = 'outbound_to_authority' and direction = 'outbound')
    or (leg_type = 'return_from_authority' and direction = 'return')
    or (leg_type in ('final_to_client', 'final_international') and direction = 'final')
    or (leg_type = 'exception_return' and direction = 'exception')
  ),
  constraint matter_shipment_legs_label_status_check check (
    label_status in ('not_created', 'rate_selected', 'purchase_pending', 'created', 'voided', 'error')
  ),
  constraint matter_shipment_legs_custody_status_check check (
    custody_status in (
      'not_started', 'prepared', 'handoff_ready', 'carrier_accepted', 'in_transit', 'authority_received',
      'return_in_transit', 'received_back', 'final_handoff', 'delivered', 'exception'
    )
  ),
  constraint matter_shipment_legs_exception_reason_check check (
    leg_type <> 'exception_return' or length(trim(coalesce(exception_reason, ''))) >= 10
  ),
  constraint matter_shipment_legs_rate_snapshot_check check (
    label_status not in ('rate_selected', 'purchase_pending', 'created') or rate_snapshot is not null
  ),
  constraint matter_shipment_legs_label_transaction_check check (
    label_status <> 'created' or provider_transaction_id is not null
  ),
  -- A created label is not a shipment; shipping requires an operator dispatch
  -- (or carrier tracking) after a label exists.
  constraint matter_shipment_legs_shipped_requires_label check (
    shipped_at is null or provider_transaction_id is not null
  ),
  constraint matter_shipment_legs_matter_sequence_key unique (matter_id, sequence)
);

-- One active leg per Matter and leg type (exception returns may repeat; a leg
-- in custody exception may be superseded by a new leg).
create unique index if not exists matter_shipment_legs_active_type_uidx
  on public.matter_shipment_legs(matter_id, leg_type)
  where leg_type <> 'exception_return' and custody_status <> 'exception';
create index if not exists matter_shipment_legs_matter_idx on public.matter_shipment_legs(matter_id);
create index if not exists matter_shipment_legs_tracking_idx on public.matter_shipment_legs(tracking_number);
create index if not exists matter_shipment_legs_transaction_idx on public.matter_shipment_legs(provider_transaction_id);
create index if not exists matter_shipment_legs_provider_shipment_idx on public.matter_shipment_legs(provider_shipment_id);
create index if not exists matter_shipment_legs_leg_type_idx on public.matter_shipment_legs(leg_type);
create index if not exists matter_shipment_legs_custody_idx on public.matter_shipment_legs(custody_status);

drop trigger if exists matter_shipment_legs_updated_at on public.matter_shipment_legs;
create trigger matter_shipment_legs_updated_at
  before update on public.matter_shipment_legs
  for each row execute function public.set_updated_at();

alter table public.matter_shipment_legs enable row level security;

-- Operators read through internal routes; clients never read this table
-- directly (the portal uses a server-side safe projection).
drop policy if exists matter_shipment_legs_operator_read on public.matter_shipment_legs;
create policy matter_shipment_legs_operator_read on public.matter_shipment_legs
  for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager','execution_coordinator','apostille_coordinator')
  );
drop policy if exists matter_shipment_legs_service_all on public.matter_shipment_legs;
create policy matter_shipment_legs_service_all on public.matter_shipment_legs
  for all to service_role using (true) with check (true);

-- ── Custody ledger append (same hash-chain pattern as migration 074) ──
create or replace function public.append_shipment_leg_custody(
  p_matter_id uuid,
  p_event text,
  p_actor_type text,
  p_status text,
  p_notes text,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_hash text;
  v_hash text;
  v_ledger_id uuid;
  v_created_at timestamptz := clock_timestamp();
begin
  select hash into v_previous_hash
  from public.custody_ledger
  where deal_id = p_matter_id and hash is not null
  order by created_at desc limit 1;
  v_previous_hash := coalesce(v_previous_hash, 'GENESIS');
  v_hash := encode(digest(concat_ws('|', p_matter_id::text, p_event, p_actor_type, p_status,
    coalesce(p_notes, ''), coalesce(p_metadata, '{}'::jsonb)::text, v_previous_hash, v_created_at::text), 'sha256'), 'hex');
  insert into public.custody_ledger (
    deal_id, event, actor_type, location, method, status, notes, metadata, prev_hash, hash, created_at
  ) values (
    p_matter_id, p_event, p_actor_type, null, 'shipment_leg', p_status, p_notes,
    coalesce(p_metadata, '{}'::jsonb), v_previous_hash, v_hash, v_created_at
  ) returning id into v_ledger_id;
  return v_ledger_id;
end;
$$;

-- ── Create leg: deterministic next sequence under the Matter row lock ──
create or replace function public.create_matter_shipment_leg(
  p_matter_id uuid,
  p_leg_type text,
  p_origin jsonb,
  p_destination jsonb,
  p_exception_reason text,
  p_actor_id uuid,
  p_reason text,
  p_evidence jsonb
)
returns setof public.matter_shipment_legs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence integer;
  v_direction text;
  v_leg public.matter_shipment_legs%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if coalesce(length(trim(p_reason)), 0) < 10 then
    raise exception using errcode = '22023', message = 'EVIDENCE_NOTE_REQUIRED';
  end if;
  v_direction := case p_leg_type
    when 'outbound_to_authority' then 'outbound'
    when 'return_from_authority' then 'return'
    when 'final_to_client' then 'final'
    when 'final_international' then 'final'
    when 'exception_return' then 'exception'
  end;
  if v_direction is null then
    raise exception using errcode = '22023', message = 'INVALID_LEG_TYPE';
  end if;

  perform 1 from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;

  select coalesce(max(sequence), 0) + 1 into v_sequence
  from public.matter_shipment_legs where matter_id = p_matter_id;

  insert into public.matter_shipment_legs (
    matter_id, leg_type, sequence, direction, origin_json, destination_json,
    exception_reason, custody_status, created_by, created_at, updated_at
  ) values (
    p_matter_id, p_leg_type, v_sequence, v_direction, p_origin, p_destination,
    nullif(trim(coalesce(p_exception_reason, '')), ''), 'prepared', p_actor_id::text, v_now, v_now
  ) returning * into v_leg;

  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id,
    case when p_leg_type = 'exception_return' then 'SHIPMENT_EXCEPTION' else 'SHIPMENT_LEG_CREATED' end,
    'courier', 'operator', p_actor_id, v_now, 'operator_shipment_leg', v_leg.id::text,
    '{}'::jsonb,
    jsonb_build_object('leg_id', v_leg.id, 'leg_type', p_leg_type, 'sequence', v_sequence, 'direction', v_direction),
    left(trim(p_reason), 1000), coalesce(p_evidence, '{}'::jsonb)
  );

  return next v_leg;
end;
$$;

-- ── Rate selection: persist the exact governed rate snapshot ──
create or replace function public.record_shipment_leg_rate(
  p_matter_id uuid,
  p_leg_id uuid,
  p_provider_shipment_id text,
  p_rate_snapshot jsonb,
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
  if v_leg.label_status not in ('not_created', 'rate_selected', 'voided', 'error') then
    raise exception using errcode = '22023', message = 'LABEL_ALREADY_PURCHASED';
  end if;
  if p_rate_snapshot is null or coalesce(p_rate_snapshot->>'provider_rate_id', '') = ''
     or coalesce(p_rate_snapshot->>'carrier', '') = '' or coalesce(p_rate_snapshot->>'selection_reason', '') = '' then
    raise exception using errcode = '22023', message = 'RATE_SNAPSHOT_INCOMPLETE';
  end if;

  update public.matter_shipment_legs
  set provider_shipment_id = p_provider_shipment_id,
      rate_snapshot = p_rate_snapshot,
      carrier = p_rate_snapshot->>'carrier',
      service_level = p_rate_snapshot->>'service',
      label_status = 'rate_selected'
  where id = p_leg_id
  returning * into v_leg;

  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, 'SHIPMENT_LEG_RATE_SELECTED', 'courier', 'operator', p_actor_id, clock_timestamp(),
    'operator_shipment_leg', p_leg_id::text, '{}'::jsonb,
    jsonb_build_object('carrier', p_rate_snapshot->>'carrier', 'service', p_rate_snapshot->>'service',
      'selection_policy', p_rate_snapshot->>'selection_policy', 'rank', p_rate_snapshot->'rank'),
    p_rate_snapshot->>'selection_reason', jsonb_build_object('leg_type', v_leg.leg_type)
  );
  return next v_leg;
end;
$$;

-- ── Label purchase claim (single in-flight purchase per leg) ──
create or replace function public.claim_shipment_leg_label(p_matter_id uuid, p_leg_id uuid)
returns setof public.matter_shipment_legs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg public.matter_shipment_legs%rowtype;
begin
  update public.matter_shipment_legs
  set label_status = 'purchase_pending'
  where id = p_leg_id and matter_id = p_matter_id and label_status = 'rate_selected' and rate_snapshot is not null
  returning * into v_leg;
  if not found then
    raise exception using errcode = '22023', message = 'LABEL_PURCHASE_NOT_PERMITTED';
  end if;
  return next v_leg;
end;
$$;

-- ── Label purchase result. A created label is NOT shipped. ──
create or replace function public.record_shipment_leg_label(
  p_matter_id uuid,
  p_leg_id uuid,
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
  v_now timestamptz := clock_timestamp();
begin
  select * into v_leg from public.matter_shipment_legs where id = p_leg_id for update;
  if not found or v_leg.matter_id <> p_matter_id then
    raise exception using errcode = 'P0002', message = 'SHIPMENT_LEG_NOT_FOUND';
  end if;
  if v_leg.label_status <> 'purchase_pending' then
    raise exception using errcode = '22023', message = 'LABEL_PURCHASE_NOT_PENDING';
  end if;

  if not p_success then
    update public.matter_shipment_legs
    set label_status = 'rate_selected',
        provider_evidence = provider_evidence || jsonb_build_object('last_purchase_failure', coalesce(p_evidence, '{}'::jsonb), 'last_purchase_failed_at', v_now)
    where id = p_leg_id returning * into v_leg;
    return next v_leg;
    return;
  end if;
  if coalesce(p_transaction_id, '') = '' then
    raise exception using errcode = '22023', message = 'TRANSACTION_REQUIRED';
  end if;

  update public.matter_shipment_legs
  set label_status = 'created',
      provider_transaction_id = p_transaction_id,
      tracking_number = nullif(p_tracking_number, ''),
      label_created_at = v_now,
      provider_evidence = provider_evidence || jsonb_build_object('label', coalesce(p_evidence, '{}'::jsonb))
  where id = p_leg_id returning * into v_leg;

  perform public.append_shipment_leg_custody(
    p_matter_id,
    case when v_leg.leg_type in ('final_to_client', 'final_international') then 'DOC_LABEL_CREATED' else 'AUTHORITY_LABEL_CREATED' end,
    'operator', 'label_created', null,
    jsonb_build_object('leg_id', v_leg.id, 'leg_type', v_leg.leg_type, 'sequence', v_leg.sequence,
      'carrier', v_leg.carrier, 'actor_id', p_actor_id)
  );
  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, 'SHIPMENT_LEG_LABEL_CREATED', 'courier', 'operator', p_actor_id, v_now,
    'operator_shipment_leg', p_leg_id::text, '{}'::jsonb,
    jsonb_build_object('carrier', v_leg.carrier, 'service', v_leg.service_level, 'label_status', 'created'),
    'Label purchased through the governed Shippo service.', jsonb_build_object('leg_type', v_leg.leg_type)
  );
  return next v_leg;
end;
$$;

-- ── Operator dispatch confirmation: custody handoff to carrier ──
create or replace function public.record_shipment_leg_dispatch(
  p_matter_id uuid,
  p_leg_id uuid,
  p_actor_id uuid,
  p_reason text
)
returns setof public.matter_shipment_legs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg public.matter_shipment_legs%rowtype;
  v_now timestamptz := clock_timestamp();
  v_event text;
begin
  if coalesce(length(trim(p_reason)), 0) < 10 then
    raise exception using errcode = '22023', message = 'EVIDENCE_NOTE_REQUIRED';
  end if;
  select * into v_leg from public.matter_shipment_legs where id = p_leg_id for update;
  if not found or v_leg.matter_id <> p_matter_id then
    raise exception using errcode = 'P0002', message = 'SHIPMENT_LEG_NOT_FOUND';
  end if;
  if v_leg.leg_type = 'return_from_authority' then
    raise exception using errcode = '22023', message = 'RETURN_LEG_DISPATCHED_BY_AUTHORITY';
  end if;
  if v_leg.label_status <> 'created' then
    raise exception using errcode = '22023', message = 'LABEL_REQUIRED_BEFORE_DISPATCH';
  end if;
  if v_leg.custody_status not in ('not_started', 'prepared', 'handoff_ready') then
    raise exception using errcode = '22023', message = 'LEG_ALREADY_DISPATCHED';
  end if;

  update public.matter_shipment_legs
  set custody_status = case when v_leg.leg_type in ('final_to_client', 'final_international') then 'final_handoff' else 'carrier_accepted' end,
      shipped_at = v_now
  where id = p_leg_id returning * into v_leg;

  v_event := case v_leg.leg_type
    when 'outbound_to_authority' then 'DOC_APOSTILLE_SUBMITTED'
    when 'exception_return' then 'EXCEPTION_RETURN_DISPATCHED'
    else 'DOC_SHIPPED'
  end;
  perform public.append_shipment_leg_custody(
    p_matter_id, v_event, 'operator', v_leg.custody_status, left(trim(p_reason), 500),
    jsonb_build_object('leg_id', v_leg.id, 'leg_type', v_leg.leg_type, 'sequence', v_leg.sequence,
      'carrier', v_leg.carrier, 'tracking_number', v_leg.tracking_number, 'actor_id', p_actor_id)
  );
  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id,
    case when v_leg.leg_type = 'outbound_to_authority' then 'AUTHORITY_DISPATCH_CONFIRMED'
         when v_leg.leg_type = 'exception_return' then 'SHIPMENT_EXCEPTION'
         else 'FINAL_SHIPMENT_STARTED' end,
    'courier', 'operator', p_actor_id, v_now, 'operator_shipment_leg', p_leg_id::text,
    '{}'::jsonb, jsonb_build_object('custody_status', v_leg.custody_status, 'shipped_at', v_now),
    left(trim(p_reason), 1000), jsonb_build_object('leg_type', v_leg.leg_type)
  );
  return next v_leg;
end;
$$;

-- ── Void an unshipped label ──
create or replace function public.record_shipment_leg_void(
  p_matter_id uuid,
  p_leg_id uuid,
  p_evidence jsonb,
  p_actor_id uuid,
  p_reason text
)
returns setof public.matter_shipment_legs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg public.matter_shipment_legs%rowtype;
begin
  if coalesce(length(trim(p_reason)), 0) < 10 then
    raise exception using errcode = '22023', message = 'EVIDENCE_NOTE_REQUIRED';
  end if;
  select * into v_leg from public.matter_shipment_legs where id = p_leg_id for update;
  if not found or v_leg.matter_id <> p_matter_id then
    raise exception using errcode = 'P0002', message = 'SHIPMENT_LEG_NOT_FOUND';
  end if;
  if v_leg.label_status <> 'created' or v_leg.shipped_at is not null then
    raise exception using errcode = '22023', message = 'LABEL_NOT_VOIDABLE';
  end if;
  update public.matter_shipment_legs
  set label_status = 'voided',
      custody_status = 'prepared',
      provider_evidence = provider_evidence || jsonb_build_object('void', coalesce(p_evidence, '{}'::jsonb))
  where id = p_leg_id returning * into v_leg;
  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, 'SHIPMENT_LEG_LABEL_VOIDED', 'courier', 'operator', p_actor_id, clock_timestamp(),
    'operator_shipment_leg', p_leg_id::text, '{}'::jsonb, jsonb_build_object('label_status', 'voided'),
    left(trim(p_reason), 1000), jsonb_build_object('leg_type', v_leg.leg_type)
  );
  return next v_leg;
end;
$$;

-- ── Carrier tracking → leg custody (idempotent, Matter-safe, leg-specific) ──
-- Never touches the Matter lifecycle: a delivered leg is not a completed Matter.
create or replace function public.record_shipment_leg_tracking(
  p_matter_id uuid,
  p_leg_id uuid,
  p_event_hash text,
  p_status text,
  p_substatus text,
  p_status_details text,
  p_status_date timestamptz,
  p_carrier text,
  p_raw jsonb
)
returns table (outcome text, custody_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg public.matter_shipment_legs%rowtype;
  v_inserted uuid;
  v_status text := upper(coalesce(p_status, ''));
  v_next text;
  v_rank_current int;
  v_rank_next int;
  v_terminal boolean;
  v_event text;
  v_now timestamptz := clock_timestamp();
  v_prior_custody text;
begin
  if coalesce(p_event_hash, '') = '' then
    raise exception using errcode = '22023', message = 'EVENT_HASH_REQUIRED';
  end if;
  select * into v_leg from public.matter_shipment_legs where id = p_leg_id for update;
  if not found or v_leg.matter_id <> p_matter_id then
    raise exception using errcode = 'P0002', message = 'SHIPMENT_LEG_NOT_FOUND';
  end if;

  insert into public.shippo_tracking_events (
    matter_id, shippo_shipment_id, shippo_transaction_id, carrier, tracking_number, status,
    substatus_code, status_details, status_date, raw_event, event_hash
  ) values (
    p_matter_id, v_leg.provider_shipment_id, v_leg.provider_transaction_id, p_carrier, v_leg.tracking_number,
    v_status, p_substatus, p_status_details, p_status_date, coalesce(p_raw, '{}'::jsonb), p_event_hash
  ) on conflict (event_hash) do nothing
  returning id into v_inserted;
  if v_inserted is null then
    return query select 'duplicate'::text, v_leg.custody_status;
    return;
  end if;

  v_prior_custody := v_leg.custody_status;
  v_terminal := v_leg.custody_status in ('authority_received', 'received_back', 'delivered');
  v_next := case
    when v_status in ('TRANSIT', 'OUT_FOR_DELIVERY') then
      case when v_leg.leg_type = 'return_from_authority' then 'return_in_transit' else 'in_transit' end
    when v_status = 'DELIVERED' then
      case v_leg.leg_type
        when 'outbound_to_authority' then 'authority_received'
        when 'return_from_authority' then 'received_back'
        else 'delivered'
      end
    when v_status in ('RETURNED', 'FAILURE') then 'exception'
    else v_leg.custody_status
  end;
  v_rank_current := array_position(array['not_started','prepared','handoff_ready','carrier_accepted','final_handoff',
    'in_transit','return_in_transit','authority_received','received_back','delivered'], v_leg.custody_status);
  v_rank_next := array_position(array['not_started','prepared','handoff_ready','carrier_accepted','final_handoff',
    'in_transit','return_in_transit','authority_received','received_back','delivered'], v_next);
  -- Monotonic: never regress custody, and a terminal leg is not reopened.
  if v_terminal or (v_next <> 'exception' and coalesce(v_rank_next, 0) <= coalesce(v_rank_current, 0)) then
    v_next := v_leg.custody_status;
  end if;

  update public.matter_shipment_legs
  set tracking_status = v_status,
      custody_status = v_next,
      shipped_at = case when v_next in ('in_transit', 'return_in_transit') and shipped_at is null
                        and provider_transaction_id is not null then coalesce(p_status_date, v_now) else shipped_at end,
      delivered_at = case when v_next in ('authority_received', 'received_back', 'delivered') and delivered_at is null
                          then coalesce(p_status_date, v_now) else delivered_at end,
      completed_at = case when v_next in ('authority_received', 'received_back', 'delivered') and completed_at is null
                          then v_now else completed_at end,
      provider_evidence = provider_evidence || jsonb_build_object('last_tracking', jsonb_build_object(
        'status', v_status, 'substatus', p_substatus, 'status_date', p_status_date, 'event_hash', p_event_hash))
  where id = p_leg_id returning * into v_leg;

  if v_next = v_prior_custody then
    return query select 'recorded'::text, v_leg.custody_status;
    return;
  end if;

  v_event := case
    when v_next = 'exception' then case when v_status = 'RETURNED' then 'COURIER_RETURNED' else 'COURIER_EXCEPTION' end
    when v_leg.leg_type in ('final_to_client', 'final_international') then
      case v_next when 'in_transit' then 'DOC_IN_TRANSIT' when 'delivered' then 'DOC_DELIVERED' else 'COURIER_UPDATE_RECEIVED' end
    when v_leg.leg_type = 'outbound_to_authority' then
      case v_next when 'in_transit' then 'AUTHORITY_SHIPMENT_IN_TRANSIT' when 'authority_received' then 'AUTHORITY_RECEIVED' else 'COURIER_UPDATE_RECEIVED' end
    when v_leg.leg_type = 'return_from_authority' then
      case v_next when 'return_in_transit' then 'AUTHORITY_RETURN_STARTED' when 'received_back' then 'AUTHORITY_RETURN_RECEIVED' else 'COURIER_UPDATE_RECEIVED' end
    else 'COURIER_UPDATE_RECEIVED'
  end;
  perform public.append_shipment_leg_custody(
    p_matter_id, v_event, 'courier', v_next, p_status_details,
    jsonb_build_object('leg_id', v_leg.id, 'leg_type', v_leg.leg_type, 'sequence', v_leg.sequence,
      'carrier', p_carrier, 'raw_status', v_status, 'status_date', p_status_date)
  );

  return query select 'applied'::text, v_leg.custody_status;
end;
$$;

revoke all on function public.append_shipment_leg_custody(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_matter_shipment_leg(uuid, text, jsonb, jsonb, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.record_shipment_leg_rate(uuid, uuid, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.claim_shipment_leg_label(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_shipment_leg_label(uuid, uuid, boolean, text, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.record_shipment_leg_dispatch(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_shipment_leg_void(uuid, uuid, jsonb, uuid, text) from public, anon, authenticated;
revoke all on function public.record_shipment_leg_tracking(uuid, uuid, text, text, text, text, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function public.append_shipment_leg_custody(uuid, text, text, text, text, jsonb) to service_role;
grant execute on function public.create_matter_shipment_leg(uuid, text, jsonb, jsonb, text, uuid, text, jsonb) to service_role;
grant execute on function public.record_shipment_leg_rate(uuid, uuid, text, jsonb, uuid) to service_role;
grant execute on function public.claim_shipment_leg_label(uuid, uuid) to service_role;
grant execute on function public.record_shipment_leg_label(uuid, uuid, boolean, text, text, jsonb, uuid) to service_role;
grant execute on function public.record_shipment_leg_dispatch(uuid, uuid, uuid, text) to service_role;
grant execute on function public.record_shipment_leg_void(uuid, uuid, jsonb, uuid, text) to service_role;
grant execute on function public.record_shipment_leg_tracking(uuid, uuid, text, text, text, text, timestamptz, text, jsonb) to service_role;

comment on table public.matter_shipment_legs is
  'Matter-linked logistics legs (logistics evidence). provider_evidence may hold the internal label URL: operator-only, never exposed to clients.';

commit;
