begin;

-- Canonical private quote truth for reviewed Matters.
-- Additive/idempotent. Existing payment/execution truth remains authoritative.

alter table public.deals
  add column if not exists matter_pricing_type text,
  add column if not exists quote_execution_method text,
  add column if not exists pricing_version text,
  add column if not exists quote_breakdown jsonb not null default '[]'::jsonb,
  add column if not exists quote_review_required boolean not null default false,
  add column if not exists quote_review_reasons jsonb not null default '[]'::jsonb,
  add column if not exists quote_approved_at timestamptz,
  add column if not exists quote_approved_by text;

alter table public.deals
  drop constraint if exists deals_matter_pricing_type_check;
alter table public.deals
  add constraint deals_matter_pricing_type_check
  check (
    matter_pricing_type is null or matter_pricing_type in (
      'authentication',
      'signature',
      'priority',
      'executive',
      'international_passport_execution'
    )
  );

alter table public.deals
  drop constraint if exists deals_quote_execution_method_check;
alter table public.deals
  add constraint deals_quote_execution_method_check
  check (
    quote_execution_method is null or quote_execution_method in ('none','ron','in_person')
  );

alter table public.deals
  drop constraint if exists deals_quote_breakdown_array_check;
alter table public.deals
  add constraint deals_quote_breakdown_array_check
  check (jsonb_typeof(quote_breakdown) = 'array');

alter table public.deals
  drop constraint if exists deals_quote_review_reasons_array_check;
alter table public.deals
  add constraint deals_quote_review_reasons_array_check
  check (jsonb_typeof(quote_review_reasons) = 'array');

create index if not exists deals_matter_pricing_type_idx
  on public.deals(matter_pricing_type)
  where matter_pricing_type is not null;

create index if not exists deals_quote_review_required_idx
  on public.deals(quote_review_required, created_at desc)
  where quote_review_required = true;

comment on column public.deals.pricing_version is
  'Canonical private pricing composer version used for the accepted Matter quote.';
comment on column public.deals.quote_breakdown is
  'Internal reviewed quote line items. Never render directly on public unauthenticated surfaces.';
comment on column public.deals.quote_review_required is
  'True when pricing is intentionally blocked pending governed operator review.';

commit;
