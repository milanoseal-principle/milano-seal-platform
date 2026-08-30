-- Production truth reconciliation after migration 070.
-- PostgreSQL function EXECUTE defaults can be inherited through PUBLIC.
-- Keep authenticated/service_role access required by existing RLS policies,
-- while ensuring anonymous callers cannot execute sensitive identity helpers.

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_operator() from public, anon;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_operator() to authenticated, service_role;
