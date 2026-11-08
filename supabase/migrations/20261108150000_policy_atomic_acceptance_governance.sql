begin;

alter table public.policy_versions
  add column if not exists activated_by uuid,
  add column if not exists retired_by uuid,
  add column if not exists retired_at timestamptz;

create or replace function public.transition_policy_version(p_id uuid, p_actor uuid, p_action text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.policy_versions%rowtype;
begin
  if not exists (
    select 1 from auth.users u
    where u.id = p_actor
      and u.raw_app_meta_data ->> 'role' in ('founder','founder_admin','admin')
      and coalesce(u.raw_app_meta_data ->> 'disabled','false') <> 'true'
      and (u.banned_until is null or u.banned_until <= now())
  ) then
    raise exception 'POLICY_AUTHORITY_REQUIRED' using errcode = '42501';
  end if;

  select * into v from public.policy_versions where id = p_id for update;
  if not found then raise exception 'POLICY_VERSION_NOT_FOUND'; end if;

  if p_action = 'activate' then
    if v.status = 'active' then return v.id; end if;
    if v.status <> 'draft' or v.effective_at > now() then
      raise exception 'INVALID_POLICY_STATUS_TRANSITION';
    end if;
    update public.policy_versions
      set status = 'superseded'
      where policy_type = v.policy_type and status = 'active';
    update public.policy_versions
      set status = 'active', activated_at = now(), activated_by = p_actor
      where id = v.id;
  elsif p_action = 'retire' then
    if v.status = 'retired' then return v.id; end if;
    if v.status not in ('draft','active') then
      raise exception 'INVALID_POLICY_STATUS_TRANSITION';
    end if;
    update public.policy_versions
      set status = 'retired', retired_by = p_actor, retired_at = now()
      where id = v.id;
  else
    raise exception 'INVALID_ACTION';
  end if;
  return v.id;
end;
$$;

revoke all on function public.transition_policy_version(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.transition_policy_version(uuid,uuid,text) to service_role;

create or replace function public.enforce_policy_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.policy_versions%rowtype;
begin
  if tg_op <> 'INSERT' then
    raise exception 'POLICY_ACCEPTANCE_APPEND_ONLY' using errcode = '42501';
  end if;
  select * into v from public.policy_versions where id = new.policy_version_id for share;
  if not found then raise exception 'POLICY_VERSION_NOT_FOUND'; end if;
  if v.status <> 'active' or v.effective_at > now() then
    raise exception 'POLICY_VERSION_NOT_ACTIVE';
  end if;
  if (new.policy_type,new.version,new.content_sha256,new.effective_at)
     is distinct from (v.policy_type,v.version,v.content_sha256,v.effective_at) then
    raise exception 'POLICY_ACCEPTANCE_VERSION_MISMATCH';
  end if;
  new.required := new.surface = any(v.required_surfaces);
  return new;
end;
$$;

revoke all on function public.enforce_policy_acceptance() from public, anon, authenticated;

commit;
