-- Forward-only repair: deny inherited table-maintenance privileges on
-- private evidence tables. RLS does not protect TRUNCATE. Preserve existing
-- row grants, column-specific SELECT, service role and immutable evidence.
begin;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'custody_ledger','identifier_locks','matter_evidence_ledger',
    'messages','notifications','ron_audit_events','ron_documents',
    'ron_sessions','ron_signers','ron_webhook_events'
  ] loop
    if to_regclass(format('public.%I',table_name)) is null then
      raise exception 'PRIVATE_EVIDENCE_TABLE_MISSING: %', table_name;
    end if;
    execute format(
      'revoke truncate, references, trigger on table public.%I from public, anon, authenticated',
      table_name
    );
  end loop;
end $$;

do $$
declare table_name text;
declare permission text;
declare role_name text;
begin
  foreach table_name in array array[
    'custody_ledger','identifier_locks','matter_evidence_ledger',
    'messages','notifications','ron_audit_events','ron_documents',
    'ron_sessions','ron_signers','ron_webhook_events'
  ] loop
    foreach role_name in array array['anon','authenticated'] loop
      foreach permission in array array['TRUNCATE','REFERENCES','TRIGGER'] loop
        if has_table_privilege(role_name,format('public.%I',table_name),permission) then
          raise exception 'PRIVATE_EVIDENCE_PRIVILEGE_REMAINS: % % %',
            role_name,table_name,permission;
        end if;
      end loop;
    end loop;
  end loop;
end $$;

commit;
