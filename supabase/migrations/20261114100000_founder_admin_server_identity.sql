-- public.is_founder_or_admin() must never trust client-editable identity.
--
-- Evidence (production, ehqdzfopsrbwewtddiwq, verified 2026-11-14): the helper defined in
-- 035_discount_codes.sql returns true when auth.jwt() -> 'user_metadata' ->> 'role' is a founder
-- or admin role. user_metadata is writable by the signed-in user (supabase.auth.updateUser), so
-- any account could claim 'founder_admin' and satisfy the six production policies that call it:
--
--   client_discount_assignments    "Founder and admin manage client discount assignments"  ALL
--   compliance_incidents           "Founder and admin manage compliance incidents"         ALL
--   critical_identifier_snapshots  "Founder and admin manage critical identifier snapshots" ALL
--   discount_audit_log             "Founder and admin manage discount audit log"           ALL
--   discount_redemptions           "Founder and admin manage discount redemptions"         ALL
--   incident_audit_log             "Founder and admin manage incident audit log"           ALL
--
-- Replacement: the role is read from auth.users.raw_app_meta_data, which only the service role can
-- write, at the time the policy is evaluated. A role change or revocation therefore takes effect on
-- the next query instead of when the user's JWT expires, and disabled or banned accounts are
-- refused, matching public.is_operator(). The approved founder/admin role set is unchanged
-- ('founder', 'founder_admin', 'admin', 'admin_operator', 'superadmin'); only the user_metadata
-- branch and stale-claim reliance are removed.
--
-- The function signature and name are unchanged, so every dependent policy keeps working without
-- being recreated. SECURITY DEFINER is required to read auth.users; search_path is empty and every
-- name is schema-qualified. Execution is limited to authenticated and service_role.
--
-- Forward-only and idempotent. No table, row or policy is created, altered or deleted.

create or replace function public.is_founder_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and coalesce(u.raw_app_meta_data ->> 'disabled', 'false') <> 'true'
      and (u.banned_until is null or u.banned_until <= now())
      and u.raw_app_meta_data ->> 'role' in ('founder', 'founder_admin', 'admin', 'admin_operator', 'superadmin')
  )
$$;

revoke all on function public.is_founder_or_admin() from public, anon;
grant execute on function public.is_founder_or_admin() to authenticated, service_role;

comment on function public.is_founder_or_admin() is
  'True only for an active, unbanned auth.users account whose server-issued app_metadata role is founder or admin. Reads auth.users only; never client-editable metadata or token claims.';
