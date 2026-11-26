-- Atomic complimentary Matter authorization and revocation.
--
-- Defect: lib/payments/complimentary-server.ts wrote the authorization row, the
-- canonical Matter (public.deals) and the audit trail as separate statements.
-- A failure after the first left an authorization without its Matter state, a
-- Matter state without its authorization, or either without its audit event,
-- and audit failures were not checked at all.
--
-- These functions perform the whole transition in one transaction: the Matter
-- row is locked, the authorization and Matter are written, and the mandatory
-- event is appended to the canonical Matter timeline (public.matter_events).
-- Any failure rolls every write back. Nothing is reported as authorized unless
-- all three committed.
--
-- Financial authority is unchanged: a complimentary Matter is never paid. The
-- functions refuse any Matter patch that is not the complimentary zero state
-- (amount_due = amount_paid = verified_revenue = 0, no Wise identifiers, no
-- payment confirmation, no payment or settlement status) instead of trusting the
-- caller, and never touch payment_confirmed, payment_status or settlement
-- fields. Scheduling is still decided only by verified Wise settlement
-- (lib/scheduling/complimentarySchedulingGate.ts).
--
-- Duplicates: the row lock serialises concurrent calls on a Matter; a repeat of
-- the same authorization id is an idempotent no-op that returns the original
-- event; a different authorization while one is active is refused (and the
-- existing uniq_active_complimentary_authorization_per_matter index still
-- applies). Service role only. Forward-only; no existing rows are changed.
begin;

create or replace function public.authorize_complimentary_matter(
  p_authorization jsonb,
  p_deal jsonb,
  p_actor text
)
returns table(authorization_id uuid, matter_event_id uuid, already_authorized boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid := nullif(p_authorization ->> 'id', '')::uuid;
  v_matter_id uuid := nullif(p_authorization ->> 'matter_id', '')::uuid;
  v_comp_authorized boolean;
  v_bound_auth uuid;
  v_event_id uuid;
  r public.complimentary_authorizations;
begin
  if v_auth_id is null or v_matter_id is null then
    raise exception 'COMPLIMENTARY_AUTHORIZATION_INVALID' using errcode = '22023';
  end if;
  -- The complimentary zero state is enforced here, not trusted from the caller.
  if (p_deal ->> 'payment_disposition') is distinct from 'complimentary'
    or (p_deal ->> 'amount_due')::numeric is distinct from 0
    or (p_deal ->> 'amount_paid')::numeric is distinct from 0
    or (p_deal ->> 'verified_revenue')::numeric is distinct from 0
    or (p_deal ->> 'wise_payment_id') is not null
    or (p_deal ->> 'wise_transfer_id') is not null
    or (p_deal ->> 'payment_confirmed_at') is not null
    or (p_deal ->> 'comp_authorized')::boolean is distinct from true
    or nullif(p_deal ->> 'comp_authorization_id', '')::uuid is distinct from v_auth_id
    or p_deal ?| array['payment_confirmed', 'payment_status', 'payment_settlement_status', 'paid_at', 'payment_observed_at']
  then
    raise exception 'COMPLIMENTARY_MATTER_STATE_INVALID' using errcode = '22023';
  end if;

  select d.comp_authorized, d.comp_authorization_id
    into v_comp_authorized, v_bound_auth
  from public.deals d
  where d.id = v_matter_id
  for update;
  if not found then
    raise exception 'COMPLIMENTARY_MATTER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_comp_authorized and v_bound_auth = v_auth_id then
    select e.id into v_event_id
    from public.matter_events e
    where e.matter_id = v_matter_id
      and e.event_type = 'COMPLIMENTARY_AUTHORIZATION_APPROVED'
      and e.metadata ->> 'authorization_id' = v_auth_id::text
    order by e.created_at
    limit 1;
    return query select v_auth_id, v_event_id, true;
    return;
  end if;
  if v_comp_authorized then
    raise exception 'COMPLIMENTARY_ALREADY_AUTHORIZED' using errcode = '23505';
  end if;

  r := jsonb_populate_record(null::public.complimentary_authorizations, p_authorization);
  insert into public.complimentary_authorizations(
    id, matter_id, quote_id, quote_version, original_subtotal, original_add_ons, original_total,
    discount_amount, final_amount_due, currency, reason_code, reason_detail,
    authorized_by_user_id, authorized_by_role, authorization_scope, status, authorized_at, audit_event_id
  ) values (
    v_auth_id, v_matter_id, r.quote_id, r.quote_version, r.original_subtotal, r.original_add_ons, r.original_total,
    r.discount_amount, coalesce(r.final_amount_due, 0), coalesce(r.currency, 'USD'), r.reason_code, r.reason_detail,
    r.authorized_by_user_id, r.authorized_by_role, coalesce(r.authorization_scope, 'single_matter'), 'active',
    coalesce(r.authorized_at, now()), r.audit_event_id
  );

  update public.deals d set
    payment_disposition = 'complimentary',
    amount_before_adjustment = (p_deal ->> 'amount_before_adjustment')::numeric,
    complimentary_adjustment_amount = coalesce((p_deal ->> 'complimentary_adjustment_amount')::numeric, 0),
    amount_due = 0,
    amount_paid = 0,
    verified_revenue = 0,
    wise_payment_id = null,
    wise_transfer_id = null,
    payment_confirmed_at = null,
    comp_authorized = true,
    comp_authorized_by = nullif(p_deal ->> 'comp_authorized_by', '')::uuid,
    comp_authorized_at = coalesce((p_deal ->> 'comp_authorized_at')::timestamptz, now()),
    comp_reason_code = p_deal ->> 'comp_reason_code',
    comp_reason_detail = p_deal ->> 'comp_reason_detail',
    comp_authorization_id = v_auth_id
  where d.id = v_matter_id;

  insert into public.matter_events(matter_id, event_type, notes, actor, client_visible, metadata)
  values (
    v_matter_id,
    'COMPLIMENTARY_AUTHORIZATION_APPROVED',
    'Complimentary Matter authorized. Payment is not required; verified revenue remains $0.',
    p_actor,
    false,
    jsonb_build_object(
      'authorization_id', v_auth_id,
      'quote_version', r.quote_version,
      'original_total', r.original_total,
      'discount_amount', r.discount_amount,
      'amount_due', 0,
      'amount_paid', 0,
      'verified_revenue', 0,
      'reason_code', r.reason_code,
      'actor_user_id', r.authorized_by_user_id,
      'actor_role', r.authorized_by_role
    )
  )
  returning id into v_event_id;

  return query select v_auth_id, v_event_id, false;
end;
$$;

create or replace function public.revoke_complimentary_matter(
  p_matter_id uuid,
  p_authorization_id uuid,
  p_reason text,
  p_actor_user_id uuid,
  p_actor text
)
returns table(revoked_at timestamptz, matter_event_id uuid, already_revoked boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_original_total numeric;
  v_revoked_at timestamptz;
  v_event_id uuid;
  v_now timestamptz := now();
begin
  if p_matter_id is null or p_authorization_id is null or p_actor_user_id is null or length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'COMPLIMENTARY_REVOCATION_INVALID' using errcode = '22023';
  end if;
  perform 1 from public.deals d where d.id = p_matter_id for update;
  if not found then
    raise exception 'COMPLIMENTARY_MATTER_NOT_FOUND' using errcode = 'P0002';
  end if;
  select a.status, a.original_total, a.revoked_at
    into v_status, v_original_total, v_revoked_at
  from public.complimentary_authorizations a
  where a.id = p_authorization_id and a.matter_id = p_matter_id
  for update;
  if not found then
    raise exception 'COMPLIMENTARY_AUTHORIZATION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_status = 'revoked' then
    select e.id into v_event_id
    from public.matter_events e
    where e.matter_id = p_matter_id
      and e.event_type = 'COMPLIMENTARY_AUTHORIZATION_REVOKED'
      and e.metadata ->> 'authorization_id' = p_authorization_id::text
    order by e.created_at
    limit 1;
    return query select v_revoked_at, v_event_id, true;
    return;
  end if;
  if v_status <> 'active' then
    raise exception 'COMPLIMENTARY_AUTHORIZATION_NOT_ACTIVE' using errcode = '22023';
  end if;

  update public.complimentary_authorizations a set
    status = 'revoked',
    revoked_at = v_now,
    revoked_by_user_id = p_actor_user_id,
    revocation_reason = p_reason
  where a.id = p_authorization_id and a.matter_id = p_matter_id;

  update public.deals d set
    payment_disposition = 'standard_payment',
    amount_due = coalesce(v_original_total, 0),
    comp_authorized = false,
    comp_revoked_at = v_now
  where d.id = p_matter_id;

  insert into public.matter_events(matter_id, event_type, notes, actor, client_visible, metadata)
  values (
    p_matter_id,
    'COMPLIMENTARY_AUTHORIZATION_REVOKED',
    p_reason,
    p_actor,
    false,
    jsonb_build_object('authorization_id', p_authorization_id, 'actor_user_id', p_actor_user_id, 'restored_amount_due', coalesce(v_original_total, 0))
  )
  returning id into v_event_id;

  return query select v_now, v_event_id, false;
end;
$$;

revoke all on function public.authorize_complimentary_matter(jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.revoke_complimentary_matter(uuid, uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.authorize_complimentary_matter(jsonb, jsonb, text) to service_role;
grant execute on function public.revoke_complimentary_matter(uuid, uuid, text, uuid, text) to service_role;

commit;
