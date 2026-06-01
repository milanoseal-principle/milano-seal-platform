-- Milano Seal — Revenue Intelligence Schema
-- Phase C: Partner registry, referral ledger, attribution lock, scorecard
-- DO NOT APPLY until operator clears after Phase B verification is stable.

-- Referral ledger: one attribution source per matter, immutable after lock
create table if not exists public.referral_ledger (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  partner_id uuid,                            -- references alliance_partners if applicable
  referral_code text,
  source_type text not null default 'direct'
    check (source_type in (
      'direct', 'partner_link', 'manual_operator',
      'utm', 'alliance_observation', 'return_client', 'unknown'
    )),
  attribution_status text not null default 'captured'
    check (attribution_status in (
      'captured', 'verified', 'locked', 'disputed', 'resolved'
    )),
  captured_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,                             -- operator email
  utm_source text,
  utm_medium text,
  utm_campaign text,
  operator_notes text,                        -- never exposed to partners
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_ledger_matter on public.referral_ledger(matter_id);
create index if not exists idx_referral_ledger_partner on public.referral_ledger(partner_id);
create index if not exists idx_referral_ledger_status on public.referral_ledger(attribution_status);

-- Partner scorecard: computed metrics per partner
create table if not exists public.partner_scorecards (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null,
  computed_at timestamptz not null default now(),
  referral_count integer not null default 0,
  conversion_count integer not null default 0,
  completion_count integer not null default 0,
  conversion_rate numeric(5,2),
  completion_rate numeric(5,2),
  avg_cycle_days numeric(6,1),
  returned_matters integer not null default 0,
  compliance_issues integer not null default 0,
  intelligence_contributions integer not null default 0,
  score_label text default 'developing'
    check (score_label in ('inactive', 'developing', 'active', 'preferred'))
);

create index if not exists idx_partner_scorecards_partner on public.partner_scorecards(partner_id);

-- Payout review: operator-initiated only, no automation
create table if not exists public.payout_reviews (
  id uuid primary key default gen_random_uuid(),
  referral_ledger_id uuid references public.referral_ledger(id) on delete cascade,
  partner_id uuid,
  matter_id uuid not null,
  review_status text not null default 'not_eligible'
    check (review_status in (
      'not_eligible', 'pending_review', 'approved', 'rejected', 'paid'
    )),
  eligibility_note text,
  operator_notes text,              -- never exposed outside operator views
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.referral_ledger enable row level security;
alter table public.partner_scorecards enable row level security;
alter table public.payout_reviews enable row level security;

-- Only service role writes; operator reads via authenticated role
create policy "service_role_referral_ledger"
  on public.referral_ledger for all to service_role using (true);
create policy "operator_read_referral_ledger"
  on public.referral_ledger for select to authenticated
  using (true);

create policy "service_role_partner_scorecards"
  on public.partner_scorecards for all to service_role using (true);
create policy "operator_read_partner_scorecards"
  on public.partner_scorecards for select to authenticated
  using (true);

create policy "service_role_payout_reviews"
  on public.payout_reviews for all to service_role using (true);
create policy "operator_read_payout_reviews"
  on public.payout_reviews for select to authenticated
  using (true);
