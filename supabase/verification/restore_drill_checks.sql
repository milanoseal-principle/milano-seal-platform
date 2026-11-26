-- Run ONLY against the isolated restore target. Counts and booleans only: no row data.
-- Probes whether RLS on the restored data refuses an anonymous caller and an arbitrary signed-in
-- client, and records security facts that the restored copy inherits from production.
create temp table restore_probe(role text, tbl text, visible bigint);
grant all on restore_probe to public;
create temp table restore_facts(fact text primary key, value bigint);

do $$
declare
  r text;
  t text;
  n bigint;
  probe_user constant text := 'b0000000-0000-4000-8000-00000000d1d1';
  sensitive constant text[] := array[
    'deals', 'payments', 'wise_payment_intents', 'wise_provider_settlement_evidence', 'matter_evidence_ledger',
    'matter_state_events', 'custody_ledger', 'document_versions', 'files', 'ron_sessions', 'ron_signers',
    'ron_documents', 'notifications', 'sales_leads', 'audit_events', 'client_profiles', 'portal_otps',
    'compliance_incidents', 'discount_redemptions'];
begin
  -- Tables that may be absent from a restored copy are read dynamically.
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select count(*) from supabase_migrations.schema_migrations' into n;
    insert into restore_facts values ('migration_ledger_entries', n);
  end if;
  perform set_config('request.jwt.claim.sub', probe_user, true);
  perform set_config('request.jwt.claims', json_build_object('sub', probe_user, 'role', 'authenticated',
    'email', 'restore-drill-probe@example.invalid', 'app_metadata', json_build_object('role', 'client'))::text, true);
  foreach r in array array['anon', 'authenticated'] loop
    foreach t in array sensitive loop
      continue when to_regclass('public.' || t) is null;
      begin
        execute format('set local role %I', r);
        execute format('select count(*) from public.%I', t) into n;
        reset role;
      exception when insufficient_privilege then
        n := -1;  -- no table privilege: denied
      end;
      insert into restore_probe values (r, t, n);
    end loop;
  end loop;
end $$;

select jsonb_build_object(
  'public_tables', (select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind in ('r', 'p')),
  'public_tables_without_rls', (select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
  'policies', (select count(*) from pg_policies where schemaname in ('public', 'storage')),
  'auth_users', (select count(*) from auth.users),
  'storage_buckets', (select count(*) from storage.buckets),
  'storage_objects_by_bucket', (select coalesce(jsonb_object_agg(bucket_id, n), '{}') from (select bucket_id, count(*) n from storage.objects group by bucket_id) b),
  'rls_probe_rows_visible_to_anon', (select coalesce(sum(visible) filter (where visible > 0), 0) from restore_probe where role = 'anon'),
  'rls_probe_rows_visible_to_arbitrary_client', (select coalesce(sum(visible) filter (where visible > 0), 0) from restore_probe where role = 'authenticated'),
  'rls_probe_tables_exposed', (select coalesce(jsonb_agg(role || ':' || tbl order by role, tbl), '[]') from restore_probe where visible > 0),
  'rls_probe_tables_checked', (select count(distinct tbl) from restore_probe),
  -- 'GENESIS' is the canonical chain root (lib/custodyLedger.ts, migrations 074/086/20261108201000),
  -- not a missing predecessor.
  'custody_chain_unlinked_rows', (select count(*) from public.custody_ledger c where c.prev_hash is not null
      and c.prev_hash <> 'GENESIS'
      and not exists (select 1 from public.custody_ledger p where p.deal_id = c.deal_id and p.hash = c.prev_hash)),
  'founder_admin_helper_reads_user_metadata', (select coalesce(bool_or(pg_get_functiondef(p.oid) ilike '%user_metadata%'), false)
      from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'is_founder_or_admin'),
  'migration_ledger_entries', (select value from restore_facts where fact = 'migration_ledger_entries')
) as restore_drill_checks;
