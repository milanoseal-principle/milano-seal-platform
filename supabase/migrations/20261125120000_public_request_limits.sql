-- Durable, concurrency-safe request limits for public cost- and abuse-bearing
-- endpoints: the paid-AI Copilot (/api/assistant), the paid-AI intake pre-read
-- (/api/intake/extract) and public Matter creation (/api/intake).
--
-- Same mechanism as public.governance_request_limit (20261108200000): one row
-- per (scope, bucket) holding the current fixed window, advanced by a single
-- atomic INSERT ... ON CONFLICT DO UPDATE, so parallel requests on any number of
-- serverless instances serialize on the row lock and are counted exactly.
-- It differs only in scope: governance limits an authenticated actor; public
-- endpoints are limited per client (an HMAC of the authenticated user id or the
-- client address, computed by the server: no raw IPs or user ids are stored)
-- and per bucket globally ('global' scope) as a daily spend ceiling.
--
-- Ceilings and windows are fixed here, not passed by the caller, so a
-- compromised or misconfigured caller cannot raise them. Forward-only and
-- additive: no existing object is changed.

begin;

create table if not exists public.public_request_windows (
  scope_hash text not null check (scope_hash = 'global' or scope_hash ~ '^[0-9a-f]{64}$'),
  bucket text not null,
  window_at timestamptz not null,
  requests integer not null check (requests > 0),
  primary key (scope_hash, bucket)
);
alter table public.public_request_windows enable row level security;
revoke all on public.public_request_windows from public, anon, authenticated;
grant select, insert, update, delete on public.public_request_windows to service_role;

create or replace function public.consume_public_request_limit(p_scope_hash text, p_bucket text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_seconds integer;
  v_ceiling integer;
  v_global boolean;
  v_window_start timestamptz;
  v_requests integer;
begin
  select p.window_seconds, p.ceiling, p.global_scope
    into v_window_seconds, v_ceiling, v_global
  from (values
    -- bucket,                   window,  ceiling, global
    ('assistant',                  600,      20,  false),
    ('assistant_global',         86400,    2000,  true),
    ('intake_extract',            3600,      10,  false),
    ('intake_extract_global',    86400,     300,  true),
    ('intake_submit',             3600,       5,  false)
  ) as p(bucket, window_seconds, ceiling, global_scope)
  where p.bucket = p_bucket;

  if v_window_seconds is null then
    raise exception using errcode = '22023', message = 'INVALID_RATE_BUCKET';
  end if;
  if v_global and p_scope_hash is distinct from 'global' then
    raise exception using errcode = '22023', message = 'GLOBAL_BUCKET_REQUIRES_GLOBAL_SCOPE';
  end if;
  if not v_global and (p_scope_hash is null or p_scope_hash !~ '^[0-9a-f]{64}$') then
    raise exception using errcode = '22023', message = 'CLIENT_BUCKET_REQUIRES_SCOPE_HASH';
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds);

  insert into public.public_request_windows as w (scope_hash, bucket, window_at, requests)
  values (p_scope_hash, p_bucket, v_window_start, 1)
  on conflict (scope_hash, bucket) do update
    set window_at = excluded.window_at,
        requests = case when w.window_at = excluded.window_at then w.requests + 1 else 1 end
  returning w.requests into v_requests;

  allowed := v_requests <= v_ceiling;
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => v_window_seconds) - now())))::integer)
  end;
  return next;
end;
$$;

revoke all on function public.consume_public_request_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_public_request_limit(text, text) to service_role;

commit;
