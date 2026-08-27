begin;

-- 053_receiving_authority_provenance_reconciliation.sql
-- Reconciles the legacy receiving_authorities table with the active dashboard API
-- and locks authority intelligence to provenance-first, fail-closed behavior.
-- No source URLs or verification facts are invented by this migration.

alter table public.receiving_authorities
  add column if not exists authority_name text,
  add column if not exists address text,
  add column if not exists accepted_document_types text[],
  add column if not exists language_requirements text,
  add column if not exists source_url text,
  add column if not exists source_type text,
  add column if not exists confidence_level text default 'UNVERIFIED_REVIEW_REQUIRED',
  add column if not exists verified_by uuid,
  add column if not exists stale_after_days integer default 180,
  add column if not exists manual_review_required boolean default true,
  add column if not exists routing_status text default 'REVIEW_REQUIRED';

-- Preserve legacy production values by copying them into the current API fields.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='receiving_authorities' and column_name='name'
  ) then
    execute 'update public.receiving_authorities set authority_name = coalesce(nullif(trim(authority_name), ''''), name) where authority_name is null or trim(authority_name) = ''''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='receiving_authorities' and column_name='accepted_documents'
  ) then
    execute 'update public.receiving_authorities set accepted_document_types = accepted_documents where accepted_document_types is null and accepted_documents is not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='receiving_authorities' and column_name='language_rules'
  ) then
    execute 'update public.receiving_authorities set language_requirements = language_rules where language_requirements is null and language_rules is not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='receiving_authorities' and column_name='source_confidence'
  ) then
    execute 'update public.receiving_authorities set confidence_level = coalesce(nullif(trim(confidence_level), ''''), source_confidence) where source_confidence is not null';
  end if;
end $$;

update public.receiving_authorities
set stale_after_days = 180
where stale_after_days is null or stale_after_days < 1;

update public.receiving_authorities
set confidence_level = 'UNVERIFIED_REVIEW_REQUIRED'
where confidence_level is null or trim(confidence_level) = '';

-- Fail closed whenever provenance is absent, stale, or not sufficiently verified.
update public.receiving_authorities
set
  manual_review_required = true,
  routing_status = 'REVIEW_REQUIRED'
where
  source_url is null
  or trim(source_url) = ''
  or last_verified_at is null
  or confidence_level in ('UNVERIFIED_REVIEW_REQUIRED', 'CLIENT_PROVIDED')
  or last_verified_at < now() - make_interval(days => stale_after_days);

-- A row may be ACTIVE only when it has an authoritative source, a current review,
-- and a confidence level that is allowed to drive operator routing.
update public.receiving_authorities
set
  manual_review_required = false,
  routing_status = 'ACTIVE'
where
  source_url is not null
  and trim(source_url) <> ''
  and last_verified_at is not null
  and last_verified_at >= now() - make_interval(days => stale_after_days)
  and confidence_level in ('VERIFIED_OFFICIAL', 'VERIFIED_OPERATOR', 'PARTNER_CONFIRMED');

alter table public.receiving_authorities
  drop constraint if exists receiving_authorities_confidence_level_check,
  drop constraint if exists receiving_authorities_routing_status_check,
  drop constraint if exists receiving_authorities_stale_after_days_check;

alter table public.receiving_authorities
  add constraint receiving_authorities_confidence_level_check check (
    confidence_level in (
      'VERIFIED_OFFICIAL',
      'VERIFIED_OPERATOR',
      'PARTNER_CONFIRMED',
      'CLIENT_PROVIDED',
      'UNVERIFIED_REVIEW_REQUIRED'
    )
  ),
  add constraint receiving_authorities_routing_status_check check (
    routing_status in ('ACTIVE', 'REVIEW_REQUIRED', 'INACTIVE')
  ),
  add constraint receiving_authorities_stale_after_days_check check (stale_after_days >= 1);

create index if not exists receiving_authorities_country_idx
  on public.receiving_authorities(country);
create index if not exists receiving_authorities_routing_status_idx
  on public.receiving_authorities(routing_status);
create index if not exists receiving_authorities_last_verified_at_idx
  on public.receiving_authorities(last_verified_at);

comment on column public.receiving_authorities.source_url is
  'Authoritative source URL. NULL/blank forces REVIEW_REQUIRED; migrations must never fabricate this value.';
comment on column public.receiving_authorities.manual_review_required is
  'Fail-closed authority gate. TRUE when provenance is missing, stale, or insufficiently verified.';
comment on column public.receiving_authorities.routing_status is
  'ACTIVE only when authority provenance and freshness controls are satisfied.';

commit;
