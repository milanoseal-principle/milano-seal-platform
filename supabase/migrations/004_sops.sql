-- 004_sops.sql: Operational SOP Library
-- Milano Seal Platform
-- Apply via: supabase db push or psql against your Supabase project
--
-- Prerequisite: 003_va_tasks.sql must be applied first.
--
-- Creates:
--   sops          — one row per Standard Operating Procedure
--   sop_versions  — append-only version history per SOP
-- ============================================================


-- ============================================================
-- 1. sops
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sops (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  category       TEXT        NOT NULL CHECK (category IN (
    'Intake','Payment','Scheduling','RON','Apostille','Translation',
    'Courier','Client Communication','VA Tasks','Alliance Dispatch','Release Authorization'
  )),
  role_scope     TEXT[]      NOT NULL DEFAULT '{}',
  status         TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version        INTEGER     NOT NULL DEFAULT 1,
  owner_id       UUID        NOT NULL,
  body_markdown  TEXT,
  checklist_json JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at   TIMESTAMPTZ
);

-- ============================================================
-- 2. sop_versions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sop_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id         UUID        NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  version        INTEGER     NOT NULL,
  body_markdown  TEXT,
  checklist_json JSONB,
  changed_by     UUID        NOT NULL,
  change_note    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS sops_category_idx     ON public.sops(category);
CREATE INDEX IF NOT EXISTS sops_status_idx        ON public.sops(status);
CREATE INDEX IF NOT EXISTS sops_role_scope_idx    ON public.sops USING gin(role_scope);
CREATE INDEX IF NOT EXISTS sop_versions_sop_id_idx ON public.sop_versions(sop_id);

-- ============================================================
-- 4. Row-Level Security
-- ============================================================

ALTER TABLE public.sops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_versions ENABLE ROW LEVEL SECURITY;

-- service_role bypasses RLS by default in Supabase (no policy needed).

-- anon: deny all
CREATE POLICY "sops_deny_anon"
  ON public.sops FOR ALL TO anon USING (false);

CREATE POLICY "sop_versions_deny_anon"
  ON public.sop_versions FOR ALL TO anon USING (false);


-- ============================================================
-- SCHEMA NOTE
-- ============================================================
-- owner_id, changed_by are UUID columns that reference auth.users
-- conceptually but carry no FK constraint (auth.users is in the auth
-- schema, not public). The app layer validates user existence before insert.
-- All mutations go through the app layer via createAdminClient().
-- ============================================================
