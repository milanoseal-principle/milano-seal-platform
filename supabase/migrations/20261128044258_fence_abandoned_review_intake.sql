begin;

alter table public.intake_submission_idempotency
  add column review_worker uuid,
  add column review_lease_until timestamptz,
  add constraint intake_review_lease_shape check (
    (review_worker is null and review_lease_until is null)
    or (review_worker is not null and review_lease_until is not null
        and state = 'processing' and deal_id is null)
  );

create function public.claim_fenced_review_intake(p_token_hash text, p_payload_hash text, p_worker uuid)
returns table(decision text, response_status integer, response_body jsonb, deal_id text)
language plpgsql security definer set search_path = ''
as $$
declare
  reservation public.intake_submission_idempotency;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
    or p_payload_hash is null or p_payload_hash !~ '^[0-9a-f]{64}$'
    or p_worker is null then
    raise exception 'INTAKE_IDEMPOTENCY_KEY_INVALID' using errcode = '22023';
  end if;

  insert into public.intake_submission_idempotency(token_hash, payload_hash, review_worker, review_lease_until)
  values (p_token_hash, p_payload_hash, p_worker, clock_timestamp() + interval '2 minutes')
  on conflict (token_hash) do nothing;
  if found then
    return query select 'owner'::text, null::integer, null::jsonb, null::text;
    return;
  end if;

  select s.* into strict reservation from public.intake_submission_idempotency s
  where s.token_hash = p_token_hash for update;
  -- Only a fenced review operation can prove its effects still belong inside
  -- the atomic writer. Preexisting processing rows cannot be reclaimed.
  if reservation.state = 'processing' and reservation.payload_hash = p_payload_hash
    and reservation.review_worker is not null and reservation.review_worker <> p_worker
    and reservation.review_lease_until <= clock_timestamp() then
    update public.intake_submission_idempotency s
    set review_worker = p_worker, review_lease_until = clock_timestamp() + interval '2 minutes', updated_at = now()
    where s.token_hash = p_token_hash;
    return query select 'owner'::text, null::integer, null::jsonb, null::text;
    return;
  end if;
  return query select * from public.lookup_intake_submission(p_token_hash, p_payload_hash);
end;
$$;

create function public.consume_review_intake_lease(p_token_hash text, p_payload_hash text, p_worker uuid)
returns void
language plpgsql set search_path = ''
as $$
begin
  perform 1 from public.intake_submission_idempotency s where s.token_hash = p_token_hash for update;
  update public.intake_submission_idempotency s
  set review_worker = null, review_lease_until = null
  where s.token_hash = p_token_hash and s.payload_hash = p_payload_hash
    and s.state = 'processing' and s.review_worker = p_worker
    and s.review_lease_until > clock_timestamp();
  if not found then
    raise exception 'INTAKE_REVIEW_LEASE_NOT_OWNED' using errcode = '22023';
  end if;
end;
$$;

alter function public.persist_review_intake_receipt(text, text, jsonb, jsonb)
  rename to persist_review_intake_receipt_unleased;
revoke all on function public.persist_review_intake_receipt_unleased(text, text, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create function public.persist_review_intake_receipt(
  p_token_hash text, p_payload_hash text, p_deal jsonb, p_response_body jsonb
)
returns table(id uuid, deal_id text)
language plpgsql security definer set search_path = ''
as $$
declare
  worker uuid;
begin
  select s.review_worker into worker from public.intake_submission_idempotency s
  where s.token_hash = p_token_hash for update;
  if worker is not null then
    raise exception 'INTAKE_REVIEW_LEASE_NOT_OWNED' using errcode = '22023';
  end if;
  return query select * from public.persist_review_intake_receipt_unleased(
    p_token_hash, p_payload_hash, p_deal, p_response_body
  );
end;
$$;

revoke all on function public.persist_review_intake_receipt(text, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.persist_review_intake_receipt(text, text, jsonb, jsonb) to service_role;

create function public.persist_fenced_review_intake(
  p_token_hash text, p_payload_hash text, p_worker uuid, p_deal jsonb, p_response_body jsonb
)
returns table(id uuid, deal_id text)
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.consume_review_intake_lease(p_token_hash, p_payload_hash, p_worker);
  return query select * from public.persist_review_intake_receipt(p_token_hash, p_payload_hash, p_deal, p_response_body);
end;
$$;

create function public.complete_fenced_review_intake(
  p_token_hash text, p_payload_hash text, p_worker uuid,
  p_response_status integer, p_response_body jsonb
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_response_status is null or p_response_status not between 400 and 499
    or p_response_body->'success' is distinct from 'false'::jsonb then
    raise exception 'INTAKE_REVIEW_FAILURE_RECEIPT_INVALID' using errcode = '22023';
  end if;
  perform public.consume_review_intake_lease(p_token_hash, p_payload_hash, p_worker);
  return public.complete_intake_submission(p_token_hash, p_payload_hash, p_response_status, p_response_body, null);
end;
$$;

-- Legacy callers may complete only unleased processing rows.
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
  if r.state <> 'processing' or r.review_worker is not null then
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

revoke all on function public.consume_review_intake_lease(text, text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.claim_fenced_review_intake(text, text, uuid),
  public.persist_fenced_review_intake(text, text, uuid, jsonb, jsonb),
  public.complete_fenced_review_intake(text, text, uuid, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.claim_fenced_review_intake(text, text, uuid),
  public.persist_fenced_review_intake(text, text, uuid, jsonb, jsonb),
  public.complete_fenced_review_intake(text, text, uuid, integer, jsonb)
  to service_role;

commit;
