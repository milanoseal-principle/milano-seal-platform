-- Alliance partners use the canonical operator identity; no alliance_partners table.
--
-- 1. Schema-as-code for the hosted operator tables. operators, operator_capabilities,
--    operator_compliance_status, operator_routing_eligibility, operator_toolbelt_status and
--    operator_availability_log exist on the hosted database (read-only P12 catalog, 2026-11-12)
--    but no repository migration created them, so fresh replays and tests could not exercise
--    the operator system. The definitions below reproduce the hosted columns, types,
--    nullability and unique keys; every statement is guarded and a no-op on the hosted database.
-- 2. Identity binding without email matching. operators.user_id is the verified auth.users link;
--    operators.profile_id (new) binds that account to its operator_profiles row and is set only by
--    an authorized operator. The status tables are keyed by operator_profiles.id.
-- 3. operators.referral_code (new): a partner's referral attribution code, matched against
--    referral_ledger.referral_code.

create table if not exists public.operators (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid,
  email      text        not null unique,
  full_name  text,
  role       text        default 'operator',
  is_active  boolean     default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.operator_capabilities (
  id               uuid        primary key default gen_random_uuid(),
  operator_id      uuid        not null,
  capability_type  text        not null,
  capability_value text        not null,
  verified         boolean     not null default false,
  created_at       timestamptz not null default now(),
  unique (operator_id, capability_type, capability_value)
);

create table if not exists public.operator_compliance_status (
  id                         uuid        primary key default gen_random_uuid(),
  operator_id                uuid        not null unique,
  compliance_ready           boolean     not null default false,
  e_o_insurance_verified     boolean     not null default false,
  background_check_passed    boolean     not null default false,
  notary_commission_verified boolean     not null default false,
  nna_certified              boolean     not null default false,
  state_license_verified     boolean     not null default false,
  data_handling_agreement    boolean     not null default false,
  brand_guidelines_accepted  boolean     not null default false,
  notes                      text,
  reviewed_at                timestamptz,
  reviewed_by                text,
  updated_at                 timestamptz not null default now()
);

create table if not exists public.operator_routing_eligibility (
  id                uuid        primary key default gen_random_uuid(),
  operator_id       uuid        not null unique,
  eligible          boolean     not null default false,
  blockers          text[]      default '{}',
  toolbelt_score    integer     default 0,
  last_evaluated_at timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.operator_toolbelt_status (
  id              uuid        primary key default gen_random_uuid(),
  operator_id     uuid        not null,
  tool_name       text        not null,
  tool_category   text        not null,
  status          text        not null default 'not_configured',
  required        boolean     not null default false,
  compliance_gate boolean     not null default false,
  completion_pct  integer     default 0,
  verified_at     timestamptz,
  updated_at      timestamptz not null default now(),
  unique (operator_id, tool_name)
);

create table if not exists public.operator_availability_log (
  id           uuid        primary key default gen_random_uuid(),
  operator_id  uuid        not null,
  availability text        not null,
  reason       text,
  set_by       text        not null default 'operator',
  created_at   timestamptz not null default now()
);

alter table public.operators                    enable row level security;
alter table public.operator_capabilities        enable row level security;
alter table public.operator_compliance_status   enable row level security;
alter table public.operator_routing_eligibility enable row level security;
alter table public.operator_toolbelt_status     enable row level security;
alter table public.operator_availability_log    enable row level security;

-- Identity binding and referral attribution.
alter table public.operators add column if not exists profile_id uuid references public.operator_profiles(id) on delete set null;
alter table public.operators add column if not exists referral_code text;

-- One account per auth user, one account per profile, one partner per referral code. Each unique
-- index is created only when existing hosted data already satisfies it, so applying this
-- migration can never fail on, or silently rewrite, existing rows.
do $$
begin
  if not exists (select 1 from public.operators where user_id is not null group by user_id having count(*) > 1)
     and to_regclass('public.operators_user_id_uidx') is null then
    create unique index operators_user_id_uidx on public.operators (user_id) where user_id is not null;
  end if;
  if to_regclass('public.operators_profile_id_uidx') is null then
    create unique index operators_profile_id_uidx on public.operators (profile_id) where profile_id is not null;
  end if;
  if to_regclass('public.operators_referral_code_uidx') is null then
    create unique index operators_referral_code_uidx on public.operators (upper(referral_code)) where referral_code is not null;
  end if;
end
$$;
