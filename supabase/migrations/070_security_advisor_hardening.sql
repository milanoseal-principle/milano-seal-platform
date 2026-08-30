-- Runtime-signature security hardening. Function identities are discovered from
-- pg_proc; no argument signature or function body is guessed or replaced.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as identity
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(array[
      'handle_deals_updated_at','set_updated_at','is_founder_or_admin','is_founder_admin_or_alliance','is_admin','handle_updated_at','evaluate_operator_eligibility','provision_operator_toolbelt','update_updated_at_column','is_operator','set_shippo_updated_at','enforce_milano_payment_gate','ms_normalize_locked_value','ms_sha256_text','ms_identifier_lock_before_write','ms_touch_updated_at','ms_assert_matter_identifiers_ready','block_test_matter_data_in_production'
    ])
  loop
    execute format('alter function %s set search_path = public, pg_temp', fn.identity);
  end loop;
end $$;

do $$
declare fn record;
begin
  for fn in select p.oid::regprocedure as identity from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('is_admin','is_operator')
  loop
    execute format('revoke execute on function %s from anon', fn.identity);
    -- authenticated is intentionally preserved: existing RLS policies may depend
    -- on these identity helpers. The functions retain their auth.uid() checks.
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['review_requests','review_request_events','seo_search_console_observations','seo_search_console_sync_runs','production_certification_runs','production_certification_evidence','seo_editorial_reviews']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon, authenticated', table_name);
      execute format('grant select, insert, update on table public.%I to service_role', table_name);
    end if;
  end loop;
end $$;

-- pg_net is intentionally not moved: extension dependency inspection must occur
-- in production before any destructive extension relocation.
