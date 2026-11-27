-- Durable public-intake replay receipts. The cookie holds a random bearer key;
-- only its SHA-256 hash and a canonical request hash are stored. The cached
-- response can contain a portal capability and Wise instruction, so RLS and
-- function execution are service-role-only. Response bodies expire after 30
-- days, while tombstones remain to prevent an old replay from creating a second
-- Matter after the response has been pruned.
begin;

create table if not exists public.intake_submission_idempotency (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  state text not null default 'processing' check (state in ('processing', 'completed', 'expired')),
  response_status integer,
  response_body jsonb,
  deal_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint intake_submission_idempotency_response_shape check (
    (state = 'processing' and response_status is null and response_body is null and completed_at is null)
    or (state = 'completed' and response_status is not null and response_status between 200 and 599 and response_body is not null and jsonb_typeof(response_body) = 'object' and completed_at is not null)
    or (state = 'expired' and response_status is null and response_body is null and completed_at is not null)
  )
);

alter table public.intake_submission_idempotency enable row level security;
revoke all on table public.intake_submission_idempotency from public, anon, authenticated, service_role;

create or replace function public.lookup_intake_submission(
  p_token_hash text,
  p_payload_hash text
)
returns table(decision text, response_status integer, response_body jsonb, deal_id text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.intake_submission_idempotency;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INTAKE_IDEMPOTENCY_KEY_INVALID' using errcode = '22023';
  end if;

  update public.intake_submission_idempotency s
  set state = 'expired', response_status = null, response_body = null, updated_at = now()
  where s.token_hash = p_token_hash
    and s.state = 'completed'
    and s.completed_at <= now() - interval '30 days';

  select s.* into r
  from public.intake_submission_idempotency s
  where s.token_hash = p_token_hash;

  if not found then
    return query select 'missing'::text, null::integer, null::jsonb, null::text;
    return;
  end if;
  if r.payload_hash <> p_payload_hash then
    return query select 'conflict'::text, null::integer, null::jsonb, r.deal_id;
    return;
  end if;
  if r.state = 'expired' then
    return query select 'expired'::text, null::integer, null::jsonb, r.deal_id;
    return;
  end if;
  if r.state = 'completed' then
    return query select 'replay'::text, r.response_status, r.response_body, r.deal_id;
    return;
  end if;
  return query select 'processing'::text, null::integer, null::jsonb, null::text;
end;
$$;

create or replace function public.claim_intake_submission(
  p_token_hash text,
  p_payload_hash text
)
returns table(decision text, response_status integer, response_body jsonb, deal_id text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
  r public.intake_submission_idempotency;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INTAKE_IDEMPOTENCY_KEY_INVALID' using errcode = '22023';
  end if;

  insert into public.intake_submission_idempotency(token_hash, payload_hash)
  values (p_token_hash, p_payload_hash)
  on conflict (token_hash) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    return query select 'owner'::text, null::integer, null::jsonb, null::text;
    return;
  end if;

  select s.* into r
  from public.intake_submission_idempotency s
  where s.token_hash = p_token_hash
  for update;
  if not found then
    raise exception 'INTAKE_IDEMPOTENCY_RESERVATION_MISSING' using errcode = 'P0002';
  end if;
  if r.payload_hash <> p_payload_hash then
    return query select 'conflict'::text, null::integer, null::jsonb, r.deal_id;
    return;
  end if;

  if r.state = 'completed' and r.completed_at <= now() - interval '30 days' then
    update public.intake_submission_idempotency s
    set state = 'expired', response_status = null, response_body = null, updated_at = now()
    where s.token_hash = p_token_hash;
    return query select 'expired'::text, null::integer, null::jsonb, r.deal_id;
    return;
  end if;
  if r.state = 'expired' then
    return query select 'expired'::text, null::integer, null::jsonb, r.deal_id;
    return;
  end if;
  if r.state = 'completed' then
    return query select 'replay'::text, r.response_status, r.response_body, r.deal_id;
    return;
  end if;
  return query select 'processing'::text, null::integer, null::jsonb, null::text;
end;
$$;

create or replace function public.complete_intake_submission(
  p_token_hash text,
  p_payload_hash text,
  p_response_status integer,
  p_response_body jsonb,
  p_deal_id text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.intake_submission_idempotency;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$'
    or p_payload_hash !~ '^[0-9a-f]{64}$'
    or p_response_status < 200
    or p_response_status > 599
    or p_response_body is null
    or jsonb_typeof(p_response_body) <> 'object'
  then
    raise exception 'INTAKE_IDEMPOTENCY_COMPLETION_INVALID' using errcode = '22023';
  end if;

  select s.* into r
  from public.intake_submission_idempotency s
  where s.token_hash = p_token_hash
  for update;
  if not found or r.payload_hash <> p_payload_hash then
    raise exception 'INTAKE_IDEMPOTENCY_RESERVATION_MISMATCH' using errcode = 'P0002';
  end if;
  if r.state = 'completed' then
    return r.response_status = p_response_status
      and r.response_body is not distinct from p_response_body
      and r.deal_id is not distinct from p_deal_id;
  end if;
  if r.state <> 'processing' then
    raise exception 'INTAKE_IDEMPOTENCY_RESERVATION_NOT_ACTIVE' using errcode = '22023';
  end if;

  update public.intake_submission_idempotency s
  set state = 'completed',
      response_status = p_response_status,
      response_body = p_response_body,
      deal_id = p_deal_id,
      updated_at = now(),
      completed_at = now()
  where s.token_hash = p_token_hash;
  return true;
end;
$$;

revoke all on function public.lookup_intake_submission(text, text) from public, anon, authenticated;
revoke all on function public.claim_intake_submission(text, text) from public, anon, authenticated;
revoke all on function public.complete_intake_submission(text, text, integer, jsonb, text) from public, anon, authenticated;
grant execute on function public.lookup_intake_submission(text, text) to service_role;
grant execute on function public.claim_intake_submission(text, text) to service_role;
grant execute on function public.complete_intake_submission(text, text, integer, jsonb, text) to service_role;

commit;
