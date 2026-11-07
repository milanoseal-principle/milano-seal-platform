-- Isolated fixture only. Uses the existing sales_leads JSON, no new schema.
\set ON_ERROR_STOP on
begin;
set local role service_role;
insert into public.sales_leads(id,email,lead_type,details) values ('9d04a6e1-c92e-4769-b423-34c68a74d81f','synthetic@example.com','counsel_inquiry','{"document_status":"pending","attribution":{"source":"instagram"}}');
create temporary table prior_snapshot as select details from public.sales_leads where id='9d04a6e1-c92e-4769-b423-34c68a74d81f';
update public.sales_leads set details = details || '{"operator_actions":[{"kind":"respond","actor":"operator","evidence_scope":"operator_attested"}]}'::jsonb where id='9d04a6e1-c92e-4769-b423-34c68a74d81f' and details=(select details from prior_snapshot);
do $$ declare affected integer; begin
  update public.sales_leads set details='{"document_status":"received"}'::jsonb where id='9d04a6e1-c92e-4769-b423-34c68a74d81f' and details=(select details from prior_snapshot);
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale snapshot overwrote operator evidence'; end if;
end $$;
update public.sales_leads set details = details || '{"document_status":"received"}'::jsonb where id='9d04a6e1-c92e-4769-b423-34c68a74d81f';
do $$ begin
  if (select details->>'document_status' from public.sales_leads where id='9d04a6e1-c92e-4769-b423-34c68a74d81f') <> 'received' then raise exception 'Upload state not confirmed'; end if;
  if (select jsonb_array_length(details->'operator_actions') from public.sales_leads where id='9d04a6e1-c92e-4769-b423-34c68a74d81f') <> 1 then raise exception 'Operator action lost'; end if;
  if (select details#>>'{attribution,source}' from public.sales_leads where id='9d04a6e1-c92e-4769-b423-34c68a74d81f') <> 'instagram' then raise exception 'Source lost'; end if;
end $$;
reset role;
rollback;
\echo 'PASS: stale JSON snapshots cannot overwrite operator evidence; upload confirmation retains source and actions'
