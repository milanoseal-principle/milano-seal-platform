-- Restore the upload write contract on the hosted files table.
--
-- The upload routes (app/api/upload, app/api/intake/upload, app/api/portal/me/upload) write
-- filename and file_path, and /api/upload also writes file_url, alongside the canonical
-- name/storage_path. The repository schema has these columns (001_initial_schema), but the
-- hosted files table was created without them (read-only P12 catalogs of 2026-11-09 and
-- 2026-11-12), so PostgREST rejects those inserts.
--
-- Additive and nullable only: no data, constraint, policy or grant change. Idempotent; a
-- no-op wherever the columns already exist (every fresh replay).

alter table public.files add column if not exists filename text;
alter table public.files add column if not exists file_path text;
alter table public.files add column if not exists file_url text;
