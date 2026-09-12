-- Production truth reconciliation after migration 070.
-- PostgreSQL function EXECUTE defaults can be inherited through PUBLIC.
-- Keep authenticated/service_role access required by existing RLS policies,
-- while ensuring anonymous callers cannot execute sensitive identity helpers.
--
-- Historical preview/shadow databases may not create every compatibility helper.
-- Apply privilege hardening only when the helper exists; never fabricate an
-- identity function solely to satisfy migration replay.
do $$
declare
  fn text;
begin
  foreach fn in array array['is_admin', 'is_operator']
  loop
    if to_regprocedure(format('public.%I()', fn)) is not null then
      execute format(
        'revoke execute on function public.%I() from public, anon',
        fn
      );
      execute format(
        'grant execute on function public.%I() to authenticated, service_role',
        fn
      );
    end if;
  end loop;
end $$;
