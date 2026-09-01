begin;

create extension if not exists pgcrypto;

alter table public.deals
  add column if not exists delivery_timestamp timestamptz;

create table if not exists public.alliance_observations (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null check (length(partner_name) between 1 and 120),
  firm text null check (firm is null or length(firm) <= 160),
  email text not null check (length(email) between 3 and 254),
  role text null check (role is null or length(role) <= 120),
  corridors jsonb not null default '[]'::jsonb check (jsonb_typeof(corridors) = 'array'),
  observation text not null check (length(observation) between 1 and 4000),
  source_url text null check (source_url is null or length(source_url) <= 500),
  ip_hash text not null check (length(ip_hash) = 64),
  request_fingerprint text not null unique check (length(request_fingerprint) = 64),
  status text not null default 'REVIEW_REQUIRED' check (status in ('REVIEW_REQUIRED','REVIEWED','REJECTED')),
  created_at timestamptz not null default now()
);

create index if not exists alliance_observations_ip_created_idx
  on public.alliance_observations(ip_hash, created_at desc);
alter table public.alliance_observations enable row level security;
revoke all on table public.alliance_observations from public, anon, authenticated;
grant select, insert on table public.alliance_observations to service_role;

create or replace function public.confirm_matter_notarial_act(
  p_matter_id uuid,
  p_expected_updated_at timestamptz,
  p_notarial_act text,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_source text,
  p_reason text
)
returns table (matter jsonb, evidence_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matter public.deals%rowtype;
  v_prior_act text;
  v_evidence_id uuid;
begin
  if p_notarial_act not in ('acknowledgment','jurat','oath_affirmation','signature_witnessing','other') then
    raise exception using errcode = '22023', message = 'INVALID_NOTARIAL_ACT';
  end if;

  select * into v_matter from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;
  if v_matter.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'STALE_MATTER_STATE';
  end if;

  v_prior_act := coalesce(v_matter.execution_truth ->> 'notarial_act', 'review_required');
  update public.deals
  set execution_truth = coalesce(execution_truth, '{}'::jsonb) || jsonb_build_object('notarial_act', p_notarial_act),
      last_activity = p_occurred_at,
      updated_at = p_occurred_at
  where id = p_matter_id
  returning * into v_matter;

  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, 'NOTARIAL_ACT_CONFIRMED', 'execution', 'operator', p_actor_id,
    p_occurred_at, p_source, coalesce(v_matter.deal_id, p_matter_id::text),
    to_jsonb(v_prior_act), to_jsonb(p_notarial_act), p_reason,
    jsonb_build_object('notarial_act', p_notarial_act, 'previous_notarial_act', v_prior_act)
  ) returning id into v_evidence_id;

  return query select to_jsonb(v_matter), v_evidence_id;
end;
$$;

create or replace function public.record_courier_delivery_transition(
  p_matter_id uuid,
  p_updates jsonb,
  p_event text,
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
  v_created_at timestamptz := now();
begin
  perform 1 from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;

  -- Courier evidence may update delivery fields only. Final Matter close remains a governed operator transition.
  update public.deals
  set delivery_status = p_updates ->> 'delivery_status',
      delivery_eta = case when p_updates ? 'delivery_eta' then (p_updates ->> 'delivery_eta')::timestamptz else delivery_eta end,
      delivery_timestamp = case when p_updates ? 'delivery_timestamp' then (p_updates ->> 'delivery_timestamp')::timestamptz else delivery_timestamp end,
      updated_at = coalesce((p_updates ->> 'updated_at')::timestamptz, now())
  where id = p_matter_id;

  select hash into v_previous_hash
  from public.custody_ledger
  where deal_id = p_matter_id and hash is not null
  order by created_at desc limit 1;
  v_previous_hash := coalesce(v_previous_hash, 'GENESIS');
  v_hash := encode(digest(concat_ws('|', p_matter_id::text, p_event, 'courier', p_status,
    coalesce(p_notes, ''), coalesce(p_metadata, '{}'::jsonb)::text, v_previous_hash, v_created_at::text), 'sha256'), 'hex');

  insert into public.custody_ledger (
    deal_id, event, actor_type, location, method, status, notes, metadata,
    prev_hash, hash, created_at
  ) values (
    p_matter_id, p_event, 'courier', null, 'shipment', p_status, p_notes,
    coalesce(p_metadata, '{}'::jsonb), v_previous_hash, v_hash, v_created_at
  ) returning id into v_ledger_id;
  return v_ledger_id;
end;
$$;

revoke all on function public.confirm_matter_notarial_act(uuid,timestamptz,text,uuid,timestamptz,text,text) from public, anon, authenticated;
grant execute on function public.confirm_matter_notarial_act(uuid,timestamptz,text,uuid,timestamptz,text,text) to service_role;
revoke all on function public.record_courier_delivery_transition(uuid,jsonb,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_courier_delivery_transition(uuid,jsonb,text,text,text,jsonb) to service_role;

commit;
