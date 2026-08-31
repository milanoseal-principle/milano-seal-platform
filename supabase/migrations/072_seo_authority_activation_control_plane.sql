-- The Milano Seal™ SEO Authority Activation Control Plane
-- Private operator-only growth evidence. Never execution authority.

create table if not exists public.seo_authority_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null check (length(btrim(organization_name)) between 2 and 240),
  canonical_domain text null,
  relationship_class text not null check (relationship_class in (
    'LAW_FIRM','CITIZENSHIP_PROFESSIONAL','PROFESSIONAL_ADVISOR','CHAMBER_ASSOCIATION',
    'NOTARY_ORGANIZATION','EDITORIAL_PUBLISHER','DIRECTORY','ALLIANCE_PARTNER','OTHER'
  )),
  country_slug text null,
  locale text null,
  pillar text null,
  target_page text not null check (target_page like '/%'),
  status text not null default 'PROSPECT' check (status in (
    'PROSPECT','CONTACTED','ENGAGED','PLACEMENT_PENDING','VERIFIED','LOST','RETIRED'
  )),
  owner_user_id uuid null,
  created_by uuid null,
  notes text null,
  last_contacted_at timestamptz null,
  next_action_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_authority_relationships_status_idx
  on public.seo_authority_relationships(status, next_action_at nulls last);
create index if not exists seo_authority_relationships_target_page_idx
  on public.seo_authority_relationships(target_page);
create index if not exists seo_authority_relationships_country_idx
  on public.seo_authority_relationships(country_slug) where country_slug is not null;

create table if not exists public.seo_authority_placements (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.seo_authority_relationships(id) on delete cascade,
  target_page text not null check (target_page like '/%'),
  source_url text not null check (source_url ~* '^https://'),
  placement_type text not null check (placement_type in (
    'EDITORIAL_CITATION','PROFESSIONAL_PROFILE','DIRECTORY_LISTING','PARTNER_PAGE',
    'RESOURCE_PAGE','ASSOCIATION_MEMBER_PAGE','REFERRAL_PAGE','OTHER'
  )),
  anchor_text text null,
  status text not null default 'PENDING' check (status in ('PENDING','VERIFIED','STALE','REMOVED','REJECTED')),
  verification_method text null check (verification_method is null or verification_method in ('MANUAL_REVIEW','HTTP_CONFIRMED','PARTNER_CONFIRMED')),
  first_seen_at timestamptz null,
  last_checked_at timestamptz null,
  last_verified_at timestamptz null,
  verified_by uuid null,
  evidence_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence_snapshot) = 'object'),
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_url, target_page),
  constraint seo_authority_placements_verified_evidence_ck check (
    status <> 'VERIFIED' or (
      length(btrim(source_url)) > 8
      and last_verified_at is not null
      and verified_by is not null
      and verification_method is not null
    )
  )
);

create index if not exists seo_authority_placements_relationship_idx
  on public.seo_authority_placements(relationship_id, status);
create index if not exists seo_authority_placements_target_page_idx
  on public.seo_authority_placements(target_page, status);
create index if not exists seo_authority_placements_verified_idx
  on public.seo_authority_placements(last_verified_at desc) where status = 'VERIFIED';

create table if not exists public.seo_activation_actions (
  id uuid primary key default gen_random_uuid(),
  action_key text not null unique,
  target_page text not null check (target_page like '/%'),
  action_type text not null check (action_type in (
    'REFRESH_CONTENT','IMPROVE_SNIPPET','BUILD_INTERNAL_LINKS','LOCALIZE_AFTER_REVIEW',
    'EARN_AUTHORITY_CITATION','PROFESSIONAL_OUTREACH','HOLD'
  )),
  priority text not null check (priority in ('CRITICAL','HIGH','MEDIUM','LOW')),
  score numeric not null check (score >= 0 and score <= 100),
  rationale text not null,
  source_signals jsonb not null default '{}'::jsonb check (jsonb_typeof(source_signals) = 'object'),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','COMPLETED','DISMISSED','SUPERSEDED')),
  owner_user_id uuid null,
  created_by uuid null,
  resolution_notes text null,
  completed_at timestamptz null,
  completed_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_activation_actions_queue_idx
  on public.seo_activation_actions(status, score desc, created_at asc);
create index if not exists seo_activation_actions_target_page_idx
  on public.seo_activation_actions(target_page);

alter table public.seo_authority_relationships enable row level security;
alter table public.seo_authority_placements enable row level security;
alter table public.seo_activation_actions enable row level security;

revoke all on public.seo_authority_relationships from public, anon, authenticated;
revoke all on public.seo_authority_placements from public, anon, authenticated;
revoke all on public.seo_activation_actions from public, anon, authenticated;

grant select, insert, update, delete on public.seo_authority_relationships to service_role;
grant select, insert, update, delete on public.seo_authority_placements to service_role;
grant select, insert, update, delete on public.seo_activation_actions to service_role;

comment on table public.seo_authority_relationships is
  'Private professional-authority relationship pipeline. Relationship status is operational evidence only and never implies legal affiliation, referral compensation, or public partnership.';
comment on table public.seo_authority_placements is
  'Private external citation/backlink evidence. VERIFIED requires explicit URL, reviewer, method, and verification timestamp; no inferred backlink claims.';
comment on table public.seo_activation_actions is
  'Derived SEO authority activation work queue. Search demand, content governance, and authority evidence remain separate signals; no query-to-revenue causation is inferred.';
