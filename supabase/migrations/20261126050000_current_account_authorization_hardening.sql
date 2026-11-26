-- Current-account authority for RLS policies that trusted login-token claims.
--
-- Defect (replayed catalog, 2026-11-26): 52 permissive policies in public and
-- storage decided access from claims copied into the caller's JWT:
--   ((auth.jwt() -> 'app_metadata') ->> 'role')          server-issued role
--   (auth.jwt() ->> 'email'), auth.email(),
--   (current_setting('request.jwt.claims')::jsonb ->> 'email')   account email
-- None checked the account's current state. An account disabled with
-- app_metadata.disabled keeps its role on every token refresh, so it kept
-- every one of these grants indefinitely (writes included: discount_codes,
-- notary_*, compliance_incidents, release_certificates, receiving_authorities,
-- translation_entries, partner_certifications ...). A banned account kept them
-- until its last token expired; a changed email kept the old owner's rows.
--
-- Fix: two helpers read the CURRENT auth.users row (never user_metadata) with
-- the same disabled / banned rules as public.is_operator(), and every affected
-- policy is rewritten in place with ALTER POLICY: the claim expression is
-- replaced by the helper and nothing else changes. Name, command, roles,
-- permissive mode and every role list stay exactly as they were, so no
-- permission is widened or narrowed except for accounts that are no longer
-- current. Policies comparing auth.role() (the PostgREST database role:
-- anon / authenticated / service_role) carry no account authority and are
-- left unchanged.
--
-- The rewrite is catalog-driven so it also covers policies that exist only in
-- the hosted database. It fails closed: if any public or storage policy still
-- reads a JWT claim afterwards (an unrecognised form), the migration raises and
-- the transaction rolls back for review. Forward-only and idempotent (a second
-- run finds nothing to rewrite). No table rows are read, changed or deleted.
begin;

-- Role of the calling account as it is NOW, or null when the account is
-- missing, deleted, disabled or banned, or when it has a public.operators
-- binding that is not active (the inactive-binding veto of 20261125231600).
create or replace function public.current_account_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select u.raw_app_meta_data ->> 'role'
    into v_role
  from auth.users u
  where u.id = auth.uid()
    and coalesce(u.raw_app_meta_data ->> 'disabled', 'false') <> 'true'
    and (u.banned_until is null or u.banned_until <= now())
    and (to_jsonb(u) ->> 'deleted_at') is null;
  if v_role is null then
    return null;
  end if;
  -- plpgsql resolves public.operators at call time, so a bare replay can create the function.
  if to_regclass('public.operators') is not null and exists (
    select 1 from public.operators o
    where o.user_id = auth.uid()
      and o.is_active is distinct from true
  ) then
    return null;
  end if;
  return v_role;
end;
$$;

-- Email of the calling account as it is NOW, or null when the account is
-- missing, deleted, disabled or banned.
create or replace function public.current_account_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
  from auth.users u
  where u.id = auth.uid()
    and coalesce(u.raw_app_meta_data ->> 'disabled', 'false') <> 'true'
    and (u.banned_until is null or u.banned_until <= now())
    and (to_jsonb(u) ->> 'deleted_at') is null
$$;

-- Each answers only about the caller. anon needs EXECUTE because several
-- rewritten policies apply to every role; for anon both return null.
revoke all on function public.current_account_role() from public;
revoke all on function public.current_account_email() from public;
grant execute on function public.current_account_role() to anon, authenticated, service_role;
grant execute on function public.current_account_email() to anon, authenticated, service_role;

do $$
declare
  r record;
  v_qual text;
  v_check text;
  v_sql text;
  v_left text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_catalog.pg_policies
    where schemaname in ('public', 'storage')
      and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ 'auth\.jwt\(\)|request\.jwt\.claims|auth\.email\(\)'
  loop
    v_qual := r.qual;
    v_check := r.with_check;
    -- Longest form first: it contains no other form, but keep the order explicit.
    v_qual := replace(v_qual, '((current_setting(''request.jwt.claims''::text, true))::jsonb ->> ''email''::text)', '( SELECT public.current_account_email())');
    v_check := replace(v_check, '((current_setting(''request.jwt.claims''::text, true))::jsonb ->> ''email''::text)', '( SELECT public.current_account_email())');
    v_qual := replace(v_qual, '((auth.jwt() -> ''app_metadata''::text) ->> ''role''::text)', '( SELECT public.current_account_role())');
    v_check := replace(v_check, '((auth.jwt() -> ''app_metadata''::text) ->> ''role''::text)', '( SELECT public.current_account_role())');
    v_qual := replace(v_qual, '(auth.jwt() ->> ''email''::text)', '( SELECT public.current_account_email())');
    v_check := replace(v_check, '(auth.jwt() ->> ''email''::text)', '( SELECT public.current_account_email())');
    v_qual := replace(v_qual, 'auth.email()', '( SELECT public.current_account_email())');
    v_check := replace(v_check, 'auth.email()', '( SELECT public.current_account_email())');

    v_sql := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.qual is not null then
      v_sql := v_sql || format(' using (%s)', v_qual);
    end if;
    if r.with_check is not null then
      v_sql := v_sql || format(' with check (%s)', v_check);
    end if;
    execute v_sql;
  end loop;

  select string_agg(format('%s.%s.%s', schemaname, tablename, policyname), ', ' order by schemaname, tablename, policyname)
    into v_left
  from pg_catalog.pg_policies
  where schemaname in ('public', 'storage')
    and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ 'auth\.jwt\(\)|request\.jwt\.claims|auth\.email\(\)';
  if v_left is not null then
    raise exception 'CURRENT_ACCOUNT_AUTHORIZATION_UNRECOGNISED_CLAIM_POLICY: %', v_left;
  end if;
end;
$$;

commit;
