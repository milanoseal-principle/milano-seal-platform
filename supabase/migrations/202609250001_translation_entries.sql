create table if not exists public.translation_entries (
  id uuid primary key default gen_random_uuid(), content_key text not null, locale text not null, source_locale text not null default 'en', source_hash text not null, source_text text not null, translated_text text not null,
  translation_method text not null check (translation_method in ('human', 'ai', 'hybrid')), risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH')), review_status text not null check (review_status in ('AUTO_TRANSLATED', 'REVIEW_REQUIRED', 'APPROVED', 'STALE')),
  translated_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references auth.users(id), model_version text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (content_key, locale, source_hash)
);
create index if not exists translation_entries_review_queue_idx on public.translation_entries (review_status, risk_level, updated_at desc);
create index if not exists translation_entries_content_locale_idx on public.translation_entries (content_key, locale, updated_at desc);
alter table public.translation_entries enable row level security;
create policy "authenticated translation reviewers can read entries" on public.translation_entries for select to authenticated using (true);
create policy "authenticated translation reviewers can update entries" on public.translation_entries for update to authenticated using (true) with check (true);
