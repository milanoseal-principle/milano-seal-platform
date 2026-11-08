-- P8: versioned policy registry and acceptance evidence. Replaces nothing: the legacy
-- public.terms_acceptances (bound to non-canonical public.matters, unused by code) is left untouched.
begin;

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_type text not null check (policy_type in ('TERMS_OF_SERVICE','PRIVACY_ACKNOWLEDGEMENT','CANCELLATION_POLICY',
    'REFUND_POLICY','EXECUTION_SERVICE_DISCLOSURE','RON_DISCLOSURE','PROFESSIONAL_COUNSEL_TERMS')),
  version text not null check (version ~ '^[A-Za-z0-9._-]{1,40}$'),
  effective_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','superseded','retired')),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  content_reference text not null,
  required_surfaces text[] not null default '{}',
  supersedes_version_id uuid references public.policy_versions(id) on delete restrict,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (policy_type, version)
);
create unique index if not exists policy_versions_one_active_per_type on public.policy_versions(policy_type) where status = 'active';

create or replace function public.protect_policy_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then raise exception using errcode = '42501', message = 'POLICY_VERSION_IMMUTABLE'; end if;
  if (NEW.policy_type, NEW.version, NEW.effective_at, NEW.content_sha256, NEW.content_reference, NEW.supersedes_version_id, NEW.created_by, NEW.created_at)
     is distinct from (OLD.policy_type, OLD.version, OLD.effective_at, OLD.content_sha256, OLD.content_reference, OLD.supersedes_version_id, OLD.created_by, OLD.created_at)
     or (OLD.status <> 'draft' and NEW.required_surfaces is distinct from OLD.required_surfaces) then
    raise exception using errcode = '42501', message = 'POLICY_VERSION_IMMUTABLE';
  end if;
  if NEW.status is distinct from OLD.status and not (
       (OLD.status = 'draft' and NEW.status in ('active','retired'))
    or (OLD.status = 'active' and NEW.status in ('superseded','retired'))) then
    raise exception using errcode = '23514', message = 'INVALID_POLICY_STATUS_TRANSITION';
  end if;
  return NEW;
end;
$$;
drop trigger if exists protect_policy_version on public.policy_versions;
create trigger protect_policy_version before update or delete on public.policy_versions
  for each row execute function public.protect_policy_version();

create table if not exists public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.policy_versions(id) on delete restrict,
  policy_type text not null,
  version text not null,
  content_sha256 text not null,
  effective_at timestamptz not null,
  accepted_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_email text,
  matter_id uuid references public.deals(id) on delete restrict,
  lead_reference text,
  surface text not null check (surface ~ '^[a-z0-9_]{1,60}$'),
  required boolean not null,
  request_metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  check (actor_user_id is not null or actor_email is not null)
);
create index if not exists idx_policy_acceptances_matter on public.policy_acceptances(matter_id, policy_type) where matter_id is not null;
create index if not exists idx_policy_acceptances_version on public.policy_acceptances(policy_version_id);

-- Acceptance must match the exact active version and content the user was shown; history is append-only.
create or replace function public.enforce_policy_acceptance()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v public.policy_versions;
begin
  if TG_OP <> 'INSERT' then raise exception using errcode = '42501', message = 'POLICY_ACCEPTANCE_APPEND_ONLY'; end if;
  select * into v from public.policy_versions where id = NEW.policy_version_id;
  if v.status <> 'active' or v.effective_at > now() then
    raise exception using errcode = '23514', message = 'POLICY_VERSION_NOT_ACTIVE';
  end if;
  if (NEW.policy_type, NEW.version, NEW.content_sha256, NEW.effective_at) is distinct from (v.policy_type, v.version, v.content_sha256, v.effective_at) then
    raise exception using errcode = '23514', message = 'POLICY_ACCEPTANCE_VERSION_MISMATCH';
  end if;
  return NEW;
end;
$$;
drop trigger if exists enforce_policy_acceptance on public.policy_acceptances;
create trigger enforce_policy_acceptance before insert or update or delete on public.policy_acceptances
  for each row execute function public.enforce_policy_acceptance();

-- Active policies required for a surface that this Matter has not accepted at the exact active version.
create or replace function public.missing_required_policy_acceptances(p_matter_id uuid, p_surface text)
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(v.policy_type || ':' || v.version order by v.policy_type), '{}')
  from public.policy_versions v
  where v.status = 'active' and v.effective_at <= now() and p_surface = any(v.required_surfaces)
    and not exists (select 1 from public.policy_acceptances a where a.policy_version_id = v.id and a.matter_id = p_matter_id);
$$;

-- The version that governed a Matter's transaction (used by cancellation/refund review).
create or replace function public.governing_policy_version(p_matter_id uuid, p_policy_type text)
returns uuid language sql stable security definer set search_path = '' as $$
  select a.policy_version_id from public.policy_acceptances a
  where a.matter_id = p_matter_id and a.policy_type = p_policy_type
  order by a.accepted_at asc limit 1;
$$;

alter table public.policy_versions enable row level security;
alter table public.policy_acceptances enable row level security;
revoke all on public.policy_versions, public.policy_acceptances from anon, authenticated;
grant select on public.policy_versions, public.policy_acceptances to authenticated;
grant all on public.policy_versions, public.policy_acceptances to service_role;
drop policy if exists policy_versions_read_published on public.policy_versions;
create policy policy_versions_read_published on public.policy_versions for select to authenticated using (status in ('active','superseded'));
drop policy if exists policy_acceptances_operator_read on public.policy_acceptances;
create policy policy_acceptances_operator_read on public.policy_acceptances for select to authenticated using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','client_support'));
revoke all on function public.protect_policy_version() from public, anon, authenticated;
revoke all on function public.enforce_policy_acceptance() from public, anon, authenticated;
revoke all on function public.missing_required_policy_acceptances(uuid, text) from public, anon, authenticated;
revoke all on function public.governing_policy_version(uuid, text) from public, anon, authenticated;
grant execute on function public.missing_required_policy_acceptances(uuid, text) to service_role;
grant execute on function public.governing_policy_version(uuid, text) to service_role;

commit;
