-- Authorized binding of an Alliance account to its operator profile, and referral-code management.
--
-- Identity chain (20261112130000): auth.users.id -> operators.user_id -> operators.profile_id ->
-- operator_profiles.id. That migration added the columns; nothing could set them. These functions
-- are the only write path: each runs as one locked transaction that verifies the acting
-- administrator, applies the change and appends the audit record, so a binding can never exist
-- without its audit row. They are executable by the server role only and never match by email.
--
-- Depends on 20261112130000_alliance_operator_identity.sql.

-- Binds (or, with p_profile null, unbinds) an operator account to an operator profile.
create or replace function public.bind_operator_profile(p_operator uuid, p_profile uuid, p_actor uuid, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_account public.operators%rowtype;
  v_code text;
  v_now timestamptz := now();
begin
  select u.raw_app_meta_data->>'role' into v_role from auth.users u where u.id = p_actor
    and coalesce(u.raw_app_meta_data->>'disabled','false') <> 'true'
    and (u.banned_until is null or u.banned_until <= v_now);
  if v_role is null or v_role not in ('founder','founder_admin','admin','owner') then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;

  select * into v_account from public.operators where id = p_operator for update;
  if not found then raise exception using errcode = 'P0002', message = 'OPERATOR_NOT_FOUND'; end if;
  if v_account.user_id is null then
    raise exception using errcode = '22023', message = 'OPERATOR_HAS_NO_USER';
  end if;
  -- An auth user mapped to more than one account has no single identity: refuse until resolved.
  if exists (select 1 from public.operators o where o.user_id = v_account.user_id and o.id <> v_account.id) then
    raise exception using errcode = '23505', message = 'OPERATOR_USER_DUPLICATE';
  end if;
  if v_account.profile_id is not distinct from p_profile then
    return jsonb_build_object('operator_id', v_account.id, 'profile_id', v_account.profile_id, 'referral_code', v_account.referral_code, 'changed', false);
  end if;

  if p_profile is not null then
    perform 1 from public.operator_profiles p where p.id = p_profile for update;
    if not found then raise exception using errcode = 'P0002', message = 'PROFILE_NOT_FOUND'; end if;
    if exists (select 1 from public.operators o where o.profile_id = p_profile and o.id <> v_account.id) then
      raise exception using errcode = '23505', message = 'PROFILE_ALREADY_BOUND';
    end if;
  elsif nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception using errcode = '22023', message = 'REASON_REQUIRED';
  end if;

  v_code := v_account.referral_code;
  if p_profile is not null and v_code is null then
    loop
      v_code := 'MSA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      exit when not exists (select 1 from public.operators o where upper(o.referral_code) = v_code);
    end loop;
  end if;

  update public.operators set profile_id = p_profile, referral_code = v_code, updated_at = v_now where id = v_account.id;
  insert into public.audit_events (actor_id, actor_role, event_type, status, route, metadata)
  values (p_actor, v_role, case when p_profile is null then 'alliance.operator_profile_unbound' else 'alliance.operator_profile_bound' end,
    'success', 'bind_operator_profile',
    jsonb_build_object('operator_id', v_account.id, 'old_profile_id', v_account.profile_id, 'new_profile_id', p_profile,
      'referral_code_issued', v_account.referral_code is null and v_code is not null, 'reason', nullif(trim(coalesce(p_reason, '')), '')));
  return jsonb_build_object('operator_id', v_account.id, 'profile_id', p_profile, 'referral_code', v_code, 'changed', true);
end;
$$;

-- Replaces an account's referral code. Existing attribution is unaffected: referral_ledger and
-- lead attribution reference the partner account id, not the code. The old code stops resolving.
create or replace function public.rotate_operator_referral_code(p_operator uuid, p_actor uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_account public.operators%rowtype;
  v_code text;
  v_now timestamptz := now();
begin
  select u.raw_app_meta_data->>'role' into v_role from auth.users u where u.id = p_actor
    and coalesce(u.raw_app_meta_data->>'disabled','false') <> 'true'
    and (u.banned_until is null or u.banned_until <= v_now);
  if v_role is null or v_role not in ('founder','founder_admin','admin','owner') then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;
  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception using errcode = '22023', message = 'REASON_REQUIRED';
  end if;

  select * into v_account from public.operators where id = p_operator for update;
  if not found then raise exception using errcode = 'P0002', message = 'OPERATOR_NOT_FOUND'; end if;
  if v_account.profile_id is null then
    raise exception using errcode = '22023', message = 'OPERATOR_NOT_BOUND';
  end if;

  loop
    v_code := 'MSA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from public.operators o where upper(o.referral_code) = v_code);
  end loop;

  update public.operators set referral_code = v_code, updated_at = v_now where id = v_account.id;
  insert into public.audit_events (actor_id, actor_role, event_type, status, route, metadata)
  values (p_actor, v_role, 'alliance.referral_code_rotated', 'success', 'rotate_operator_referral_code',
    jsonb_build_object('operator_id', v_account.id, 'old_referral_code', v_account.referral_code, 'new_referral_code', v_code, 'reason', trim(p_reason)));
  return jsonb_build_object('operator_id', v_account.id, 'profile_id', v_account.profile_id, 'referral_code', v_code, 'changed', true);
end;
$$;

revoke all on function public.bind_operator_profile(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.rotate_operator_referral_code(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.bind_operator_profile(uuid, uuid, uuid, text) to service_role;
grant execute on function public.rotate_operator_referral_code(uuid, uuid, text) to service_role;
