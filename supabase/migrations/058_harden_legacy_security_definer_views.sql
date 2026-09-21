begin;

-- Supabase security-linter closeout: legacy views must execute with the
-- querying role's permissions/RLS, never the view owner's elevated rights.
--
-- Fresh/shadow databases do not necessarily contain every historical
-- compatibility view. Harden only views that actually exist so migration replay
-- remains deterministic without fabricating unused legacy objects.
do $$
declare
  view_name text;
begin
  foreach view_name in array array[
    'client_safe_invoice_view',
    'client_safe_timeline_view',
    'pipeline_summary',
    'daily_leads',
    'operator_current_availability',
    'matter_identifier_lock_status'
  ]
  loop
    if to_regclass(format('public.%I', view_name)) is not null then
      execute format(
        'alter view public.%I set (security_invoker = true)',
        view_name
      );
    end if;
  end loop;
end $$;

-- Client-safe projections are signed-in read-only surfaces when present.
do $$
declare
  view_name text;
begin
  foreach view_name in array array[
    'client_safe_invoice_view',
    'client_safe_timeline_view'
  ]
  loop
    if to_regclass(format('public.%I', view_name)) is not null then
      execute format('revoke all on public.%I from anon, authenticated', view_name);
      execute format('grant select on public.%I to authenticated', view_name);
    end if;
  end loop;
end $$;

-- Internal aggregate/operator projections are server-only when present.
do $$
declare
  view_name text;
begin
  foreach view_name in array array[
    'pipeline_summary',
    'daily_leads',
    'operator_current_availability',
    'matter_identifier_lock_status'
  ]
  loop
    if to_regclass(format('public.%I', view_name)) is not null then
      execute format('revoke all on public.%I from anon, authenticated', view_name);
    end if;
  end loop;
end $$;

commit;
