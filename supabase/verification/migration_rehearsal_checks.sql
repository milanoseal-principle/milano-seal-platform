-- Postconditions of the eight production security/schema migrations. Read-only: catalog lookups only,
-- no row data, no writes. Used by the isolated restore drill's migration rehearsal (on the disposable
-- restored copy) and suitable, unchanged, for post-migration verification of the hosted database.
--
--   20261114100000_founder_admin_server_identity        20261112090000_revoke_unrestricted_public_rls_policies
--   20261112120000_va_task_ledger                       20261112130000_alliance_operator_identity
--   20261112140000_operator_profile_binding             20261113150000_rejected_referral_not_convertible
--   20261114090000_restrict_authenticated_allow_all_policies
--   20261114110000_require_operator_unique_indexes
with
fn as (
  select p.proname, p.oid, p.prosecdef, p.proconfig, pg_get_functiondef(p.oid) def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('is_founder_or_admin', 'va_task_transition', 'bind_operator_profile', 'rotate_operator_referral_code',
                      'sales_leads_refuse_rejected_referral_link', 'is_own_alliance_account', 'convert_sales_lead_to_matter')
),
idx as (
  select c.relname, i.indisunique, i.indisvalid, i.indisready
  from pg_index i join pg_class c on c.oid = i.indexrelid join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('operators_user_id_uidx', 'operators_profile_id_uidx', 'operators_referral_code_uidx')
),
legacy as (
  select tablename || ':' || policyname p from pg_policies
  where schemaname = 'public' and (tablename, policyname) in (
    ('payments', 'Service role full access'), ('activity_logs', 'Service role full access'),
    ('webhook_events', 'Service role full access'), ('rate_limits', 'Allow rate limit checks'),
    ('release_certificates', 'release_certificates_authenticated_write'),
    ('receiving_authorities', 'receiving_authorities_authenticated_only'))
),
open_policies as (
  select tablename || ':' || policyname p from pg_policies
  where schemaname = 'public'
    and tablename in ('liaison_intake_records', 'referral_ledger', 'payout_reviews', 'partner_scorecards', 'translation_entries')
    and permissive = 'PERMISSIVE'
    and roles && array['public', 'anon', 'authenticated']::name[]
    and (coalesce(qual, '') = 'true' or coalesce(with_check, '') = 'true')
),
facts as (
  select jsonb_build_object(
    'founder_helper_reads_user_metadata', coalesce((select def ilike '%user_metadata%' from fn where proname = 'is_founder_or_admin'), true),
    'founder_helper_reads_app_metadata', coalesce((select def ilike '%raw_app_meta_data%' from fn where proname = 'is_founder_or_admin'), false),
    'founder_helper_security_definer', coalesce((select prosecdef from fn where proname = 'is_founder_or_admin'), false),
    'founder_helper_fixed_search_path', coalesce((select proconfig::text ilike '%search_path=%' from fn where proname = 'is_founder_or_admin'), false),
    'founder_helper_executable_by_anon', coalesce((select has_function_privilege('anon', oid, 'execute') from fn where proname = 'is_founder_or_admin'), true),
    'legacy_unrestricted_policies_present', (select coalesce(jsonb_agg(p order by p), '[]') from legacy),
    'va_tables_present', to_regclass('public.va_tasks') is not null and to_regclass('public.va_task_events') is not null,
    'va_tables_rls_enabled', coalesce((select bool_and(relrowsecurity) from pg_class where oid in (to_regclass('public.va_tasks'), to_regclass('public.va_task_events'))), false)
      and to_regclass('public.va_tasks') is not null,
    'va_transition_rpc_present', exists (select 1 from fn where proname = 'va_task_transition'),
    'va_transition_rpc_executable_by_authenticated', coalesce((select bool_or(has_function_privilege('authenticated', oid, 'execute')) from fn where proname = 'va_task_transition'), false),
    'operator_identity_columns_present', (select count(*) = 2 from information_schema.columns
      where table_schema = 'public' and table_name = 'operators' and column_name in ('profile_id', 'referral_code')),
    'operator_binding_rpcs_present', (select count(*) = 2 from fn where proname in ('bind_operator_profile', 'rotate_operator_referral_code')),
    'operator_binding_rpcs_executable_by_client_roles', coalesce((select bool_or(has_function_privilege('authenticated', oid, 'execute') or has_function_privilege('anon', oid, 'execute'))
      from fn where proname in ('bind_operator_profile', 'rotate_operator_referral_code')), false),
    'rejected_referral_guard_trigger_enabled', exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
      where c.oid = to_regclass('public.sales_leads') and t.tgname = 'sales_leads_refuse_rejected_referral_link' and t.tgenabled <> 'D'),
    'partner_ownership_helper_present', exists (select 1 from fn where proname = 'is_own_alliance_account'),
    'authenticated_allow_all_policies', (select coalesce(jsonb_agg(p order by p), '[]') from open_policies),
    'operator_unique_indexes_valid', (select count(*) from idx where indisunique and indisvalid and indisready)
  ) f
)
select f || jsonb_build_object('failures', (
  select coalesce(jsonb_agg(k order by k), '[]') from (
    select 'founder_helper_reads_user_metadata' k where (f->>'founder_helper_reads_user_metadata')::boolean
    union all select 'founder_helper_reads_app_metadata' where not (f->>'founder_helper_reads_app_metadata')::boolean
    union all select 'founder_helper_security_definer' where not (f->>'founder_helper_security_definer')::boolean
    union all select 'founder_helper_fixed_search_path' where not (f->>'founder_helper_fixed_search_path')::boolean
    union all select 'founder_helper_executable_by_anon' where (f->>'founder_helper_executable_by_anon')::boolean
    union all select 'legacy_unrestricted_policies_present' where jsonb_array_length(f->'legacy_unrestricted_policies_present') > 0
    union all select 'va_tables_present' where not (f->>'va_tables_present')::boolean
    union all select 'va_tables_rls_enabled' where not (f->>'va_tables_rls_enabled')::boolean
    union all select 'va_transition_rpc_present' where not (f->>'va_transition_rpc_present')::boolean
    union all select 'va_transition_rpc_executable_by_authenticated' where (f->>'va_transition_rpc_executable_by_authenticated')::boolean
    union all select 'operator_identity_columns_present' where not (f->>'operator_identity_columns_present')::boolean
    union all select 'operator_binding_rpcs_present' where not (f->>'operator_binding_rpcs_present')::boolean
    union all select 'operator_binding_rpcs_executable_by_client_roles' where (f->>'operator_binding_rpcs_executable_by_client_roles')::boolean
    union all select 'rejected_referral_guard_trigger_enabled' where not (f->>'rejected_referral_guard_trigger_enabled')::boolean
    union all select 'partner_ownership_helper_present' where not (f->>'partner_ownership_helper_present')::boolean
    union all select 'authenticated_allow_all_policies' where jsonb_array_length(f->'authenticated_allow_all_policies') > 0
    union all select 'operator_unique_indexes_valid' where (f->>'operator_unique_indexes_valid')::int <> 3
  ) failed)) as migration_rehearsal_checks
from facts;
