create table if not exists public.seo_editorial_reviews (
  id uuid primary key default gen_random_uuid(), country_slug text not null, document_slug text not null,
  status text not null default 'REVIEW_REQUIRED' check (status in ('DRAFT','REVIEW_REQUIRED','APPROVED','BLOCKED','STALE')),
  reviewed_by uuid null, reviewed_at timestamptz null, review_due_at timestamptz null, notes text null,
  blocking_reasons jsonb not null default '[]'::jsonb check (jsonb_typeof(blocking_reasons) = 'array'), evidence_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_snapshot) = 'array'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(country_slug, document_slug)
);
alter table public.seo_editorial_reviews enable row level security;
revoke all on public.seo_editorial_reviews from anon, authenticated;
grant select, insert, update on public.seo_editorial_reviews to service_role;
