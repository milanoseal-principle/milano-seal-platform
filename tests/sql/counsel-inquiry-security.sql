-- Run only in an isolated PostgreSQL fixture after the counsel migration.
-- Roles and the deals stub are provisioned by the QA harness, not production.
\set ON_ERROR_STOP on
begin;
insert into public.deals(id) values ('765ebc96-11d2-43a3-9ce6-be9b502523dd');
set local role service_role;
insert into public.sales_leads(id, email, lead_type, details)
values ('b628ed63-a1ed-4603-8094-c10acc105b84', 'synthetic@example.com', 'counsel_inquiry', '{"document_status":"not_provided"}');
update public.sales_leads set canonical_matter_id = '765ebc96-11d2-43a3-9ce6-be9b502523dd' where id = 'b628ed63-a1ed-4603-8094-c10acc105b84';
reset role;
do $$ begin
  if not (select relrowsecurity from pg_class where oid='public.sales_leads'::regclass) then raise exception 'RLS is disabled'; end if;
  if (select count(*) from public.sales_leads) <> 1 then raise exception 'Service persistence failed'; end if;
  if exists(select 1 from pg_policies where tablename='sales_leads' and roles && array['anon','authenticated']::name[]) then raise exception 'Public inquiry policy exists'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform id from public.sales_leads; raise exception 'Anonymous read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.sales_leads(email) values('attack@example.com'); raise exception 'Anonymous write unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin perform id from public.sales_leads; raise exception 'Authenticated read unexpectedly allowed'; exception when insufficient_privilege then null; end;
  begin update public.sales_leads set canonical_matter_id=null; raise exception 'Authenticated association unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ begin
  begin update public.sales_leads set canonical_matter_id='00000000-0000-4000-8000-000000000000'; raise exception 'Nonexistent Matter unexpectedly accepted'; exception when foreign_key_violation then null; end;
  begin insert into public.sales_leads(id,email) values('b628ed63-a1ed-4603-8094-c10acc105b84','retry@example.com'); raise exception 'Duplicate ID unexpectedly accepted'; exception when unique_violation then null; end;
end $$;
reset role;
rollback;
\echo 'PASS: service persistence, private grants, RLS enabled, Matter FK and duplicate-ID protection'
