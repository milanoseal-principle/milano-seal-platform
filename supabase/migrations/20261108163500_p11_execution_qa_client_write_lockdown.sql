-- P11: execution QA is an operator/server authority, not a browser-writable status table.
-- Existing app/api/dashboard/execution-qa routes already project safe fields via
-- service-role reads and authorize through the authoritative server role.
-- Applies after the P4B witness QA writer; do NOT rewrite migration 025.
begin;

alter table public.execution_qa_reviews enable row level security;
alter table public.execution_qa_checklist_items enable row level security;

-- The legacy blanket authenticated FOR ALL policies permit forging QA PASSED,
-- witness COMPLETE, and checklist items without verified evidence.
drop policy if exists "execution_qa_authenticated" on public.execution_qa_reviews;
drop policy if exists "qa_checklist_authenticated" on public.execution_qa_checklist_items;

revoke all on table public.execution_qa_reviews from public, anon, authenticated;
revoke all on table public.execution_qa_checklist_items from public, anon, authenticated;

-- Dedicated server routes and reviewed SQL functions use the service role.
grant select, insert, update, delete on public.execution_qa_reviews to service_role;
grant select, insert, update, delete on public.execution_qa_checklist_items to service_role;

-- Explicit deny-by-absence for untrusted browsers. Future role-specific direct
-- access requires a separate reviewed RLS/grant migration.
comment on table public.execution_qa_reviews is
  'Server-governed QA reviews; browser roles cannot forge PASSED or witness COMPLETE.';
comment on table public.execution_qa_checklist_items is
  'Server-governed QA checklist; client writes require reviewed server command.';

commit;
