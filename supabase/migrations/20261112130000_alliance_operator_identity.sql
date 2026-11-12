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

-- 4. Alliance referrals are canonical sales_leads (lead_type 'alliance_referral') and become Matters
--    through the same governed transition as every other lead. Only the lead-type allowlist
--    changes; the body is otherwise identical to 20261107215959_p3_domestic_execution.sql (actor
--    role check, row lock, idempotent linkage, required client name and email, evidence ledger).
--    create or replace keeps the function's existing grants.
create or replace function public.convert_sales_lead_to_matter(p_lead_id uuid, p_actor_id uuid)
returns table(matter_id uuid, duplicate boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_lead public.sales_leads%rowtype;
  v_id uuid;
  v_preference text;
  v_truth jsonb;
  v_now timestamptz := now();
begin
  if not exists (select 1 from auth.users u where u.id = p_actor_id
    and coalesce(u.raw_app_meta_data->>'disabled','false') <> 'true'
    and (u.banned_until is null or u.banned_until <= v_now)
    and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')) then
    raise exception using errcode='42501', message='FORBIDDEN';
  end if;
  select * into v_lead from public.sales_leads where id=p_lead_id for update;
  if not found then raise exception using errcode='P0002', message='LEAD_NOT_FOUND'; end if;
  if v_lead.canonical_matter_id is not null then
    return query select v_lead.canonical_matter_id, true;
    return;
  end if;
  if v_lead.lead_type not in ('pricing_request','concierge_inquiry','client_intake','alliance_referral') or v_lead.lead_type is null then
    raise exception using errcode='22023', message='LEAD_REQUIRES_ITS_GOVERNED_WORKFLOW';
  end if;
  if nullif(trim(v_lead.full_name),'') is null or nullif(trim(v_lead.email),'') is null then
    raise exception using errcode='22023', message='LEAD_CONTACT_REQUIRED';
  end if;
  v_preference := coalesce(v_lead.details->>'customer_execution_preference', v_lead.details->>'execution_preference',
    case when v_lead.product_interest='ron' then 'ron' else 'review_required' end);
  if v_preference not in ('ron','in_person','mobile','already_notarized','third_party_notary','review_required') then v_preference := 'review_required'; end if;
  v_truth := jsonb_build_object('version',1,'notarization_requirement','review_required',
    'execution_method','review_required','notarial_act','review_required','authentication_requirement','review_required',
    'signer_location',nullif(v_lead.details->>'signer_location',''),
    'execution_location',null,'assigned_notary',null,'notary_jurisdiction',null,'certificate_type',null,
    'ron_kba_status',null,'ron_credential_analysis_status',null);
  insert into public.deals (deal_id, access_token, client_name, email, phone, document_type,
    destination_country, origin_state, customer_execution_preference, execution_truth,
    payment_status, payment_confirmed, amount_paid, currency, status, deal_status,
    quote_review_required, quote_review_reasons, internal_notes)
  values ('MS-' || extract(year from v_now)::text || '-' || p_lead_id::text, gen_random_uuid()::text,
    v_lead.full_name, lower(trim(v_lead.email)), v_lead.phone, v_lead.document_type,
    coalesce(nullif(trim(v_lead.country),''), nullif(trim(v_lead.details->>'destination'),'')),
    nullif(v_lead.details->>'document_origin',''), v_preference, v_truth,
    'unpaid',false,0,'USD','intake_received','reviewing',true,'["EXECUTION_REVIEW_REQUIRED"]'::jsonb,
    jsonb_build_object('source_lead_id',v_lead.id,'source_route',v_lead.source_route,'service_intent',v_lead.product_interest,
      'lead_context',v_lead.details,'execution_review',jsonb_build_object('required',true))::text)
  returning id into v_id;
  update public.sales_leads set canonical_matter_id=v_id,linked_by=p_actor_id,linked_at=v_now where id=p_lead_id;
  insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,actor_id,occurred_at,source,source_reference,new_value,reason)
  values(v_id,'LEAD_LINKED_TO_MATTER','execution','operator',p_actor_id,v_now,'operator_lead_conversion',p_lead_id::text,
    jsonb_build_object('lead_id',p_lead_id,'matter_id',v_id,'customer_execution_preference',v_preference),
    'Operator opened canonical Matter review; no pricing, payment or execution authority was established.');
  return query select v_id,false;
end;
$$;
