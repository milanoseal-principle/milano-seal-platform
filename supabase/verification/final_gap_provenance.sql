-- READ ONLY. Run on the approved target; retain preview/production results separately.
-- This never applies migrations, changes roles or reads customer documents.
begin transaction read only;
select current_database() database_name,current_setting('server_version') server_version;
select version from supabase_migrations.schema_migrations order by version;
select c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('deals','document_versions','custody_ledger','policy_versions','policy_acceptances','retention_classes','notifications','production_certification_runs','production_certification_evidence','matter_financial_artifacts','governance_agents','governance_tasks','governance_approvals','governance_attempts','governance_holds','audit_events') order by c.relname;
select p.proname,pg_get_function_identity_arguments(p.oid) arguments,p.prosecdef,p.proacl,
 encode(sha256(convert_to(pg_get_functiondef(p.oid),'utf8')),'hex') definition_sha256
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and (p.proname like 'governance_%' or p.proname in ('is_operator','is_valid_matter_transition','enforce_canonical_matter_transition','check_payment_gate','issue_financial_artifact','append_custody_event','record_document_release','finalize_production_certification','missing_required_policy_acceptances')) order by p.proname,arguments;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname;
select event_object_table,trigger_name,action_timing,event_manipulation from information_schema.triggers where trigger_schema='public' order by event_object_table,trigger_name;
select tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename in ('deals','document_versions','custody_ledger','notifications','governance_tasks','governance_attempts') order by tablename,indexname;
select agent_id,enabled,charter_hash from public.governance_agents order by agent_id;
select paused,mode,concurrency_limit,daily_budget from public.governance_settings;
rollback;
