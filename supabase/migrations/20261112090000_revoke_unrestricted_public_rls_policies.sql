-- Remove hosted-only RLS policies that granted unrestricted access to the PUBLIC role.
--
-- Evidence: read-only P12 catalog of project ehqdzfopsrbwewtddiwq, observed
-- 2026-11-12T07:54:16Z. These policies exist only in the hosted database (no repository
-- migration creates them). Their expressions were identified by exact md5 match of the
-- deparsed pg_policies text, and anon/authenticated hold table privileges on every table:
--
--   payments               "Service role full access"                  ALL     USING true  CHECK true
--   activity_logs          "Service role full access"                  ALL     USING true  CHECK true
--   webhook_events         "Service role full access"                  ALL     USING true  CHECK true
--   rate_limits            "Allow rate limit checks"                   ALL     USING true
--   release_certificates   release_certificates_authenticated_write    ALL     USING auth.uid() IS NOT NULL
--   receiving_authorities  receiving_authorities_authenticated_only    ALL     USING auth.uid() IS NOT NULL
--
-- With the public anon key, anyone could read, insert, update or delete these rows through
-- the Data API; any signed-in client could rewrite release certificates and receiving-
-- authority routing truth.
--
-- The application reaches all six tables only through the service-role client, which
-- bypasses RLS, so no application path depends on these policies. Repository-defined
-- policies are untouched: release_certificates keeps operator/service/valid-public-read
-- policies and receiving_authorities keeps its operator/service policies where present.
--
-- Forward-only and idempotent. Tables are checked with to_regclass because some exist only
-- in the hosted database; on a fresh replay every statement is a no-op.

do $$
begin
  if to_regclass('public.payments') is not null then
    drop policy if exists "Service role full access" on public.payments;
  end if;
  if to_regclass('public.activity_logs') is not null then
    drop policy if exists "Service role full access" on public.activity_logs;
  end if;
  if to_regclass('public.webhook_events') is not null then
    drop policy if exists "Service role full access" on public.webhook_events;
  end if;
  if to_regclass('public.rate_limits') is not null then
    drop policy if exists "Allow rate limit checks" on public.rate_limits;
  end if;
  if to_regclass('public.release_certificates') is not null then
    drop policy if exists release_certificates_authenticated_write on public.release_certificates;
  end if;
  if to_regclass('public.receiving_authorities') is not null then
    drop policy if exists receiving_authorities_authenticated_only on public.receiving_authorities;
  end if;
end
$$;
