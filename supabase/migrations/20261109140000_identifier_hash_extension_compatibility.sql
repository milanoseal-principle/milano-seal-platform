-- Forward-only identifier SHA-256 compatibility repair. PostgreSQL's
-- built-in sha256(bytea) eliminates dependency on the installed pgcrypto
-- extension schema (public in fresh replay, extensions on hosted).
-- UTF-8 bytes and 64-character lowercase hexadecimal output are unchanged.
-- No existing identifier values or hashes are rewritten.
begin;

create or replace function public.ms_sha256_text(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select pg_catalog.encode(
    pg_catalog.sha256(pg_catalog.convert_to(coalesce(p_value, ''), 'UTF8')),
    'hex'
  );
$$;

-- CREATE OR REPLACE preserves the function's existing EXECUTE grants.
do $$
begin
  if public.ms_sha256_text('') <> 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
     or public.ms_sha256_text('abc') <> 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  then raise exception 'IDENTIFIER_SHA256_COMPATIBILITY_FAILED'; end if;
end $$;

commit;
