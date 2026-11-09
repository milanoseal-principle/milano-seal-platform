-- Forward-only repair: pgcrypto is installed in the extensions schema on the
-- inspected hosted Milano Seal project. 070 locked the function search_path
-- without including that schema, making the previously unqualified digest()
-- fail at runtime. Do not recalculate or modify historical identifier hashes.
begin;

do $$
begin
  if to_regprocedure('extensions.digest(bytea,text)') is null then
    raise exception 'PGCRYPTO_DIGEST_NOT_INSTALLED_IN_EXTENSIONS';
  end if;
end
$$;

create or replace function public.ms_sha256_text(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(pg_catalog.coalesce(p_value, ''), 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

-- CREATE OR REPLACE preserves pre-existing EXECUTE privileges.
-- The routine has no privileged side effects; do not broaden its grants.
do $$
begin
  if public.ms_sha256_text('') <> 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
     or public.ms_sha256_text('abc') <> 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  then
    raise exception 'IDENTIFIER_SHA256_COMPATIBILITY_FAILED';
  end if;
end $$;

commit;
