begin;

-- Harden translation review mutation authority.
-- The translation cache is server-managed. Authenticated users may not mutate
-- translations unless their server-issued app_metadata role is explicitly
-- authorized for translation/content review.

alter table public.translation_entries enable row level security;

drop policy if exists "authenticated translation reviewers can update entries"
  on public.translation_entries;
drop policy if exists "operator translation reviewers can update entries"
  on public.translation_entries;

create policy "operator translation reviewers can update entries"
  on public.translation_entries
  for update
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in (
      'founder_admin',
      'admin',
      'admin_operator',
      'ops_manager',
      'translation_coordinator'
    )
  )
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') in (
      'founder_admin',
      'admin',
      'admin_operator',
      'ops_manager',
      'translation_coordinator'
    )
  );

comment on table public.translation_entries is
  'Server-managed translation cache. Authenticated mutation is restricted to approved operator/content-review roles; service-role translation persistence remains server-side.';

commit;
