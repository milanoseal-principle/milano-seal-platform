do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='incident_type' and t.typtype='e'
  ) then
    execute 'alter type public.incident_type add value if not exists ''RON_EXECUTED_BYTES_CHANGED''';
    execute 'alter type public.incident_type add value if not exists ''RON_SECURITY_COMPROMISE''';
  end if;
end $$;
