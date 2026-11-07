-- P3 forward repair: 046 is absent on the hosted project and predates 089's
-- verified-settlement stage. Preserve all existing payment triggers and rows.
begin;

create table if not exists public.matter_state_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete restrict,
  previous_state text,
  new_state text not null,
  actor_id text,
  correlation_id text not null default gen_random_uuid()::text,
  reason text,
  accepted boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_matter_state_events_matter
  on public.matter_state_events(matter_id, created_at desc);
alter table public.matter_state_events enable row level security;
revoke all on public.matter_state_events from public, anon, authenticated, service_role;
grant select on public.matter_state_events to service_role;

-- Matches lib/stateMachine.ts, including the settlement stage introduced by 089.
create or replace function public.is_valid_matter_transition(p_from text, p_to text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(case
    when p_from is null then p_to='intake_received'
    when p_from=p_to then p_to in ('intake_received','under_review','quoted','awaiting_payment',
      'payment_confirmed','scheduled','in_execution','apostille_processing','in_transit','delivered','completed','dormant')
    when p_from='intake_received' then p_to='under_review'
    when p_from='under_review' then p_to='quoted'
    when p_from='quoted' then p_to='awaiting_payment'
    when p_from='awaiting_payment' then p_to='payment_confirmed'
    when p_from='payment_confirmed' then p_to='scheduled'
    when p_from='scheduled' then p_to='in_execution'
    when p_from='in_execution' then p_to in ('apostille_processing','in_transit')
    when p_from='apostille_processing' then p_to='in_transit'
    when p_from='in_transit' then p_to='delivered'
    when p_from='delivered' then p_to='completed'
    else false end, false);
$$;
revoke all on function public.is_valid_matter_transition(text,text) from public, anon, authenticated;
grant execute on function public.is_valid_matter_transition(text,text) to service_role;

create or replace function public.enforce_canonical_matter_transition()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP='INSERT' then
    if not public.is_valid_matter_transition(null,NEW.status) then
      raise exception using errcode='23514',message='INVALID_MATTER_INITIAL_STATE';
    end if;
    insert into public.matter_state_events(matter_id,previous_state,new_state,actor_id,reason)
    values(NEW.id,null,NEW.status,coalesce(auth.uid()::text,'system'),'initial state');
  elsif NEW.status is distinct from OLD.status then
    if not public.is_valid_matter_transition(OLD.status,NEW.status) then
      raise exception using errcode='23514',message='INVALID_MATTER_TRANSITION';
    end if;
    insert into public.matter_state_events(matter_id,previous_state,new_state,actor_id,reason)
    values(NEW.id,OLD.status,NEW.status,coalesce(auth.uid()::text,'system'),'canonical transition');
  end if;
  return NEW;
end;
$$;
revoke all on function public.enforce_canonical_matter_transition() from public, anon, authenticated;

-- AFTER is intentional: the new Matter must exist before its FK audit record,
-- and 089's BEFORE payment trigger may advance status on a payment-field update.
-- An exception still rolls back the full write and all associated audit records.
drop trigger if exists enforce_canonical_matter_transition on public.deals;
create trigger enforce_canonical_matter_transition
  after insert or update on public.deals
  for each row execute function public.enforce_canonical_matter_transition();

create or replace function public.reject_matter_state_event_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception using errcode='42501',message='MATTER_STATE_EVENTS_APPEND_ONLY';
end;
$$;
revoke all on function public.reject_matter_state_event_mutation() from public, anon, authenticated;
drop trigger if exists reject_matter_state_event_mutation on public.matter_state_events;
create trigger reject_matter_state_event_mutation
  before update or delete on public.matter_state_events
  for each row execute function public.reject_matter_state_event_mutation();

-- Validate existing rows without rewriting any client's operational history.
alter table public.deals drop constraint if exists deals_canonical_status_check;
alter table public.deals add constraint deals_canonical_status_check check (
  status is not null and status in ('intake_received','under_review','quoted','awaiting_payment',
    'payment_confirmed','scheduled','in_execution','apostille_processing','in_transit','delivered','completed','dormant')
) not valid;
alter table public.deals validate constraint deals_canonical_status_check;
commit;
