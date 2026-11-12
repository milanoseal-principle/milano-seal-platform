-- VA task ledger: va_tasks + va_task_events on the hosted database, plus one atomic,
-- ownership- and state-checked transition function for completion and escalation.
--
-- The repository creates these tables in 003_va_tasks.sql, but the hosted database never
-- applied that file (read-only P12 catalog, 2026-11-12), so every VA task screen and action
-- failed there. This migration reproduces the 003 contract unchanged (columns, checks,
-- indexes, RLS, VA own-task read policy). Every statement is guarded, so it is a no-op
-- wherever 003 already ran (every fresh replay).
--
-- Tasks reference the canonical Matter (public.deals.id). assigned_to / assigned_by / actor_id
-- are auth.users ids validated by the application (auth schema has no FK from public).

create table if not exists public.va_tasks (
  id            uuid        primary key default gen_random_uuid(),
  matter_id     uuid        references public.deals(id) on delete set null,
  assigned_to   uuid        not null,
  assigned_by   uuid        not null,
  task_type     text        not null
    check (task_type in (
      'verify_upload', 'request_missing_id', 'translation_follow_up', 'courier_confirmation',
      'schedule_reminder', 'apostille_follow_up', 'embassy_dependency', 'client_follow_up',
      'release_coordination', 'document_correction_required'
    )),
  status        text        not null default 'pending'
    check (status in ('pending', 'in_progress', 'review', 'escalated', 'completed', 'cancelled')),
  urgency       text        not null default 'medium'
    check (urgency in ('critical', 'high', 'medium', 'low')),
  due_at        timestamptz,
  completed_at  timestamptz,
  escalated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  notes_public  text,
  next_action   text
);
create index if not exists va_tasks_assigned_to_idx on public.va_tasks (assigned_to);
create index if not exists va_tasks_status_idx      on public.va_tasks (status);
create index if not exists va_tasks_matter_id_idx   on public.va_tasks (matter_id);

create table if not exists public.va_task_events (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references public.va_tasks(id) on delete cascade,
  matter_id   uuid        references public.deals(id) on delete set null,
  actor_id    uuid        not null,
  event_type  text        not null
    check (event_type in ('VA_TASK_CREATED', 'VA_TASK_ASSIGNED', 'VA_TASK_COMPLETED', 'VA_TASK_ESCALATED', 'VA_TASK_CANCELLED')),
  description text,
  severity    text        not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  created_at  timestamptz not null default now()
);
create index if not exists va_task_events_task_id_idx  on public.va_task_events (task_id);
create index if not exists va_task_events_actor_id_idx on public.va_task_events (actor_id);

alter table public.va_tasks       enable row level security;
alter table public.va_task_events enable row level security;

-- anon: no policy, default deny. authenticated: a VA reads only tasks assigned to them.
-- No direct client writes; mutations go through the server (service role) and the function below.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'va_tasks' and policyname = 'va_own_task_read') then
    create policy "va_own_task_read" on public.va_tasks for select to authenticated using (assigned_to = auth.uid());
  end if;
end
$$;
-- Explicit privileges, independent of platform default grants: anon nothing; authenticated may
-- only read (and the policy limits that to its own tasks); no client writes; server full access.
revoke all on public.va_tasks, public.va_task_events from anon, authenticated;
grant select on public.va_tasks to authenticated;
grant all on public.va_tasks, public.va_task_events to service_role;

-- Atomic VA task transition. Locks the task, requires the verified actor to own it and the
-- task to be in a state that allows the action, then updates it and appends the event in the
-- same transaction. Returns the updated task id. Callable by the server only.
create or replace function public.va_task_transition(p_task uuid, p_actor uuid, p_action text, p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.va_tasks%rowtype;
begin
  if p_task is null or p_actor is null or p_action not in ('complete', 'escalate') then
    raise exception 'VA_TASK_TRANSITION_INVALID';
  end if;
  select * into t from public.va_tasks where id = p_task for update;
  if not found then raise exception 'VA_TASK_NOT_FOUND'; end if;
  if t.assigned_to is distinct from p_actor then raise exception 'VA_TASK_NOT_ASSIGNED'; end if;
  if p_action = 'complete' then
    if t.status not in ('pending', 'in_progress', 'review', 'escalated') then raise exception 'VA_TASK_STATE_CONFLICT'; end if;
    update public.va_tasks set status = 'completed', completed_at = now(), updated_at = now() where id = t.id;
    insert into public.va_task_events (task_id, matter_id, actor_id, event_type, description, severity)
    values (t.id, t.matter_id, p_actor, 'VA_TASK_COMPLETED', coalesce(nullif(btrim(p_reason), ''), 'Task marked complete by VA'), 'info');
  else
    if t.status not in ('pending', 'in_progress', 'review') then raise exception 'VA_TASK_STATE_CONFLICT'; end if;
    -- The escalation reason is internal: it is kept in the event ledger, never in notes_public.
    update public.va_tasks set status = 'escalated', escalated_at = now(), updated_at = now() where id = t.id;
    insert into public.va_task_events (task_id, matter_id, actor_id, event_type, description, severity)
    values (t.id, t.matter_id, p_actor, 'VA_TASK_ESCALATED', coalesce(nullif(btrim(p_reason), ''), 'Task escalated by VA'), 'warning');
  end if;
  return t.id;
end
$$;
revoke all on function public.va_task_transition(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.va_task_transition(uuid, uuid, text, text) to service_role;
