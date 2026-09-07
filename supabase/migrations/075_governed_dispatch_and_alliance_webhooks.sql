-- Governed Dispatch + Alliance webhook evidence
-- Additive only. Does not create a second Matter/state/payment/RON/release authority.

create table if not exists public.dispatch_requests (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  status text not null default 'requested'
    check (status in ('requested','offered','accepted','declined','reassigned','escalated','cancelled','completed')),
  requested_by uuid null,
  requested_by_role text not null,
  requested_service text not null default 'execution',
  priority text not null default 'normal'
    check (priority in ('normal','high','urgent')),
  requirements jsonb not null default '{}'::jsonb
    check (jsonb_typeof(requirements) = 'object'),
  assigned_operator_id uuid null references public.operator_profiles(id) on delete restrict,
  assignment_id uuid null references public.operator_assignments(id) on delete restrict,
  escalation_reason text null,
  reassignment_reason text null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  offered_at timestamptz null,
  accepted_at timestamptz null,
  completed_at timestamptz null,
  escalated_at timestamptz null
);

create index if not exists dispatch_requests_matter_status_idx
  on public.dispatch_requests(matter_id, status, created_at desc);
create index if not exists dispatch_requests_operator_status_idx
  on public.dispatch_requests(assigned_operator_id, status, created_at desc);

alter table public.dispatch_requests enable row level security;
revoke all on public.dispatch_requests from anon, authenticated;
grant select, insert, update on public.dispatch_requests to service_role;

create table if not exists public.alliance_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('job','toolbelt','credential')),
  event_key text not null unique,
  matter_id uuid null references public.deals(id) on delete restrict,
  partner_id uuid null references public.execution_partners(id) on delete restrict,
  signature_version text not null default 'v1',
  status text not null default 'OBSERVED' check (status in ('OBSERVED','REVIEW_REQUIRED','REJECTED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  received_at timestamptz not null default now()
);

create index if not exists alliance_webhook_events_matter_idx
  on public.alliance_webhook_events(matter_id, received_at desc);
create index if not exists alliance_webhook_events_partner_idx
  on public.alliance_webhook_events(partner_id, received_at desc);

alter table public.alliance_webhook_events enable row level security;
revoke all on public.alliance_webhook_events from anon, authenticated;
grant select, insert on public.alliance_webhook_events to service_role;

create or replace function public.create_dispatch_request(
  p_matter_id uuid,
  p_requested_by uuid,
  p_requested_by_role text,
  p_requested_service text,
  p_priority text,
  p_requirements jsonb,
  p_idempotency_key text
)
returns public.dispatch_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.dispatch_requests;
begin
  if not exists (select 1 from public.deals where id = p_matter_id) then
    raise exception 'MATTER_NOT_FOUND';
  end if;

  insert into public.dispatch_requests(
    matter_id, requested_by, requested_by_role, requested_service,
    priority, requirements, idempotency_key
  ) values (
    p_matter_id, p_requested_by, coalesce(nullif(trim(p_requested_by_role),''),'unknown'),
    coalesce(nullif(trim(p_requested_service),''),'execution'),
    case when p_priority in ('normal','high','urgent') then p_priority else 'normal' end,
    coalesce(p_requirements, '{}'::jsonb), p_idempotency_key
  )
  on conflict (idempotency_key) do update
    set updated_at = public.dispatch_requests.updated_at
  returning * into v_row;

  if not exists (
    select 1 from public.matter_events
    where matter_id = p_matter_id
      and event_type = 'DISPATCH_REQUESTED'
      and metadata->>'dispatch_request_id' = v_row.id::text
  ) then
    insert into public.matter_events(matter_id, event_type, actor, client_visible, metadata)
    values (
      p_matter_id,
      'DISPATCH_REQUESTED',
      coalesce(p_requested_by::text, p_requested_by_role),
      false,
      jsonb_build_object(
        'dispatch_request_id', v_row.id,
        'requested_service', v_row.requested_service,
        'priority', v_row.priority
      )
    );
  end if;

  return v_row;
end;
$$;

create or replace function public.assign_dispatch_request(
  p_dispatch_id uuid,
  p_operator_id uuid,
  p_assigned_by text
)
returns public.dispatch_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispatch public.dispatch_requests;
  v_assignment public.operator_assignments;
  v_key text;
begin
  select * into v_dispatch
  from public.dispatch_requests
  where id = p_dispatch_id
  for update;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;
  if v_dispatch.status not in ('requested','declined','reassigned','escalated','offered') then
    raise exception 'DISPATCH_STATE_CONFLICT';
  end if;

  if v_dispatch.assignment_id is not null and v_dispatch.assigned_operator_id = p_operator_id and v_dispatch.status = 'offered' then
    return v_dispatch;
  end if;

  if v_dispatch.assignment_id is not null then
    update public.operator_assignments
    set assignment_status = 'reassigned', updated_at = now()
    where id = v_dispatch.assignment_id
      and assignment_status in ('offered','accepted','in_progress');
  end if;

  v_key := 'dispatch:' || p_dispatch_id::text || ':operator:' || p_operator_id::text;

  insert into public.operator_assignments(
    operator_id, deal_id, assigned_by, assignment_status,
    dispatch_confirmed, idempotency_key
  ) values (
    p_operator_id, v_dispatch.matter_id, coalesce(nullif(trim(p_assigned_by),''),'system'),
    'offered', false, v_key
  )
  on conflict (idempotency_key) do update
    set updated_at = now()
  returning * into v_assignment;

  update public.dispatch_requests
  set status = 'offered',
      assigned_operator_id = p_operator_id,
      assignment_id = v_assignment.id,
      offered_at = now(),
      updated_at = now()
  where id = p_dispatch_id
  returning * into v_dispatch;

  insert into public.matter_events(matter_id, event_type, actor, client_visible, metadata)
  values (
    v_dispatch.matter_id,
    'DISPATCH_ASSIGNED',
    coalesce(nullif(trim(p_assigned_by),''),'system'),
    false,
    jsonb_build_object(
      'dispatch_request_id', v_dispatch.id,
      'assignment_id', v_assignment.id,
      'operator_id', p_operator_id
    )
  );

  return v_dispatch;
end;
$$;

create or replace function public.escalate_dispatch_request(
  p_dispatch_id uuid,
  p_reason text,
  p_actor text
)
returns public.dispatch_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispatch public.dispatch_requests;
begin
  update public.dispatch_requests
  set status = 'escalated',
      escalation_reason = left(coalesce(nullif(trim(p_reason),''),'Operator escalation requested'), 1000),
      escalated_at = now(),
      updated_at = now()
  where id = p_dispatch_id
    and status not in ('cancelled','completed')
  returning * into v_dispatch;

  if not found then raise exception 'DISPATCH_STATE_CONFLICT'; end if;

  insert into public.matter_events(matter_id, event_type, actor, client_visible, metadata)
  values (
    v_dispatch.matter_id,
    'DISPATCH_ESCALATED',
    coalesce(nullif(trim(p_actor),''),'system'),
    false,
    jsonb_build_object(
      'dispatch_request_id', v_dispatch.id,
      'reason', v_dispatch.escalation_reason,
      'assignment_id', v_dispatch.assignment_id
    )
  );

  return v_dispatch;
end;
$$;

create or replace function public.transition_dispatch_assignment(
  p_assignment_id uuid,
  p_operator_id uuid,
  p_action text
)
returns public.dispatch_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public.operator_assignments;
  v_dispatch public.dispatch_requests;
  v_next_assignment_status text;
  v_next_dispatch_status text;
begin
  select * into v_assignment
  from public.operator_assignments
  where id = p_assignment_id and operator_id = p_operator_id
  for update;

  if not found then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;

  if p_action = 'accept' and v_assignment.assignment_status = 'offered' then
    v_next_assignment_status := 'accepted'; v_next_dispatch_status := 'accepted';
  elsif p_action = 'decline' and v_assignment.assignment_status = 'offered' then
    v_next_assignment_status := 'declined'; v_next_dispatch_status := 'declined';
  elsif p_action = 'complete' and v_assignment.assignment_status = 'accepted' then
    v_next_assignment_status := 'in_progress'; v_next_dispatch_status := 'accepted';
  elsif p_action = 'complete' and v_assignment.assignment_status = 'in_progress' then
    v_next_assignment_status := 'completed'; v_next_dispatch_status := 'completed';
  else
    raise exception 'INVALID_ASSIGNMENT_TRANSITION';
  end if;

  update public.operator_assignments
  set assignment_status = v_next_assignment_status,
      dispatch_confirmed = case when p_action = 'accept' then true else dispatch_confirmed end,
      updated_at = now()
  where id = p_assignment_id;

  update public.dispatch_requests
  set status = v_next_dispatch_status,
      accepted_at = case when p_action = 'accept' then now() else accepted_at end,
      completed_at = case when v_next_dispatch_status = 'completed' then now() else completed_at end,
      updated_at = now()
  where assignment_id = p_assignment_id
  returning * into v_dispatch;

  if not found then raise exception 'DISPATCH_NOT_FOUND'; end if;

  insert into public.matter_events(matter_id, event_type, actor, client_visible, metadata)
  values (
    v_dispatch.matter_id,
    'DISPATCH_' || upper(p_action),
    p_operator_id::text,
    false,
    jsonb_build_object(
      'dispatch_request_id', v_dispatch.id,
      'assignment_id', p_assignment_id,
      'assignment_status', v_next_assignment_status,
      'dispatch_status', v_next_dispatch_status
    )
  );

  return v_dispatch;
end;
$$;

revoke all on function public.create_dispatch_request(uuid,uuid,text,text,text,jsonb,text) from public, anon, authenticated;
revoke all on function public.assign_dispatch_request(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.escalate_dispatch_request(uuid,text,text) from public, anon, authenticated;
revoke all on function public.transition_dispatch_assignment(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.create_dispatch_request(uuid,uuid,text,text,text,jsonb,text) to service_role;
grant execute on function public.assign_dispatch_request(uuid,uuid,text) to service_role;
grant execute on function public.escalate_dispatch_request(uuid,text,text) to service_role;
grant execute on function public.transition_dispatch_assignment(uuid,uuid,text) to service_role;
