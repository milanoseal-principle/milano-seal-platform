-- 046_canonical_matter_state_machine.sql
-- One operational Matter lifecycle. Payment/quote/shipment/document states remain
-- separate domains. Known legacy aliases are migrated once; runtime writes must
-- use canonical values.

create extension if not exists pgcrypto;

alter table public.deals add column if not exists status text;

update public.deals set status='intake_received' where status='new';
update public.deals set status='under_review' where status='reviewing';
update public.deals set status='apostille_processing' where status='apostille';
update public.deals set status='in_transit' where status='shipped';
update public.deals set status='completed' where status in ('complete');
update public.deals set status='in_execution' where status='execution_completed';

alter table public.deals drop constraint if exists deals_canonical_status_check;
alter table public.deals
  add constraint deals_canonical_status_check
  check (status in (
    'intake_received','under_review','quoted','awaiting_payment','scheduled',
    'in_execution','apostille_processing','in_transit','delivered','completed'
  )) not valid;

create table if not exists public.matter_state_events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.deals(id) on delete cascade,
  previous_state text,
  new_state text not null,
  actor_id text,
  correlation_id text not null default gen_random_uuid()::text,
  reason text,
  accepted boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_matter_state_events_matter on public.matter_state_events(matter_id, created_at desc);
alter table public.matter_state_events enable row level security;

create or replace function public.is_valid_matter_transition(p_from text, p_to text)
returns boolean language sql immutable as $$
  select case
    when p_from is null and p_to='intake_received' then true
    when p_from=p_to then true
    when p_from='intake_received' and p_to='under_review' then true
    when p_from='under_review' and p_to='quoted' then true
    when p_from='quoted' and p_to='awaiting_payment' then true
    when p_from='awaiting_payment' and p_to='scheduled' then true
    when p_from='scheduled' and p_to='in_execution' then true
    when p_from='in_execution' and p_to in ('apostille_processing','in_transit') then true
    when p_from='apostille_processing' and p_to='in_transit' then true
    when p_from='in_transit' and p_to='delivered' then true
    when p_from='delivered' and p_to='completed' then true
    else false
  end;
$$;

create or replace function public.enforce_canonical_matter_transition()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if NEW.status is null then NEW.status := 'intake_received'; end if;

  if TG_OP='INSERT' then
    if not public.is_valid_matter_transition(null, NEW.status) then
      raise exception 'INVALID_MATTER_STATE: initial status must be intake_received';
    end if;
    insert into public.matter_state_events(matter_id,previous_state,new_state,actor_id,reason)
    values (NEW.id,null,NEW.status,coalesce(auth.uid()::text,'system'),'initial state');
    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    if not public.is_valid_matter_transition(OLD.status, NEW.status) then
      insert into public.matter_state_events(matter_id,previous_state,new_state,actor_id,reason,accepted)
      values (NEW.id,OLD.status,NEW.status,coalesce(auth.uid()::text,'system'),'rejected transition',false);
      raise exception 'INVALID_MATTER_TRANSITION: % -> %', OLD.status, NEW.status;
    end if;

    insert into public.matter_state_events(matter_id,previous_state,new_state,actor_id,reason)
    values (NEW.id,OLD.status,NEW.status,coalesce(auth.uid()::text,'system'),'canonical transition');
  end if;
  return NEW;
end;
$$;

drop trigger if exists enforce_canonical_matter_transition on public.deals;
create trigger enforce_canonical_matter_transition
  before insert or update of status on public.deals
  for each row execute function public.enforce_canonical_matter_transition();

-- Payment gate aligned to the same canonical protected states.
create or replace function public.check_payment_gate()
returns trigger as $$
declare
  protected_states text[] := array[
    'scheduled','in_execution','apostille_processing','in_transit','delivered','completed'
  ];
begin
  if NEW.status = any(protected_states)
     and coalesce(OLD.status,'') <> all(protected_states) then
    if NEW.payment_confirmed=true or NEW.payment_status='paid' then return NEW; end if;

    if NEW.payment_disposition='complimentary'
       and NEW.comp_authorized=true
       and NEW.comp_authorization_id is not null
       and NEW.comp_authorized_at is not null
       and NEW.comp_revoked_at is null
       and NEW.payment_confirmed=false
       and coalesce(NEW.amount_paid,0)=0
       and coalesce(NEW.verified_revenue,0)=0
       and exists (
         select 1 from public.complimentary_authorizations ca
         where ca.id=NEW.comp_authorization_id and ca.matter_id=NEW.id
           and ca.status='active' and ca.final_amount_due=0
           and ca.discount_amount=ca.original_total
       ) then return NEW;
    end if;

    raise exception 'PAYMENT_REQUIRED: matter cannot advance to % without verified payment or active complimentary authorization', NEW.status;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists enforce_payment_gate_on_status_insert on public.deals;
create trigger enforce_payment_gate_on_status_insert
  before insert on public.deals for each row execute function public.check_payment_gate();

drop trigger if exists enforce_payment_gate_on_status_update on public.deals;
create trigger enforce_payment_gate_on_status_update
  before update of status on public.deals for each row execute function public.check_payment_gate();
