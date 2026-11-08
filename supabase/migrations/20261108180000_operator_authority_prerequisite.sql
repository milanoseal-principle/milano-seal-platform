begin;
-- Add the missing canonical helper referenced by the historical deals-access
-- migration. Hosted databases receive this forward migration before governance.
-- Fresh databases replay this idempotent prerequisite before historical policies;
-- the exact dependency order is recorded in migration-replay-plan.json.
create or replace function public.is_operator() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u where u.id=auth.uid()
 and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true'
 and (u.banned_until is null or u.banned_until<=now())
 and u.raw_app_meta_data->>'role' in ('operator','founder','founder_admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator','finance','finance_operator','client_support','compliance_reviewer','admin','owner'))
$$;
revoke all on function public.is_operator() from public,anon;
grant execute on function public.is_operator() to authenticated,service_role;
commit;
