create table if not exists public.seo_search_console_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  status text not null check (status in ('RUNNING', 'SUCCEEDED', 'FAILED')),
  fetched integer not null default 0 check (fetched >= 0),
  persisted integer not null default 0 check (persisted >= 0),
  error_code text null,
  error_message text null,
  trigger_type text not null check (trigger_type in ('MANUAL', 'CRON')),
  actor_user_id uuid null
);

create index if not exists seo_search_console_sync_runs_started_idx
  on public.seo_search_console_sync_runs (started_at desc);
create index if not exists seo_search_console_sync_runs_success_idx
  on public.seo_search_console_sync_runs (completed_at desc)
  where status = 'SUCCEEDED';

alter table public.seo_search_console_sync_runs enable row level security;
revoke all on public.seo_search_console_sync_runs from anon, authenticated;
grant select, insert, update on public.seo_search_console_sync_runs to service_role;
