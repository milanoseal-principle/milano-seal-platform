-- Forward-only portal-code buckets. Retains every existing paid-AI and intake
-- ceiling exactly; extends public.consume_public_request_limit(text,text) only.
-- Do not merge/deploy portal callers until this migration is applied and verified.
-- L1 access: 30/client/hour; email sends: 3/Matter/15m; attempts: 5/Matter/15m.
-- The RPC remains service-role-only, with its original fixed ceilings.
begin;

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
    ('intake_submit',             3600,       5,  false),
    ('portal_auth_client',        3600,      30,  false),
    ('portal_code_send',           900,       3,  false),
    ('portal_code_attempt',        900,       5,  false)
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

revoke all on function public.consume_public_request_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_public_request_limit(text, text) to service_role;

commit;
