-- 005_audit_events.sql: Security audit event log
-- Milano Seal Platform
-- Apply via: Supabase SQL Editor → New Query → paste and run
--
-- Prerequisite: 002_rls_storage_policies.sql must be applied first.
--
-- Creates:
--   audit_events — append-only log of security and access events
--
-- RLS:
--   admin/ops_manager authenticated users: SELECT only
--   service_role (createAdminClient): INSERT only
--   anon: denied
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        NULL,
  actor_email  TEXT        NULL,
  actor_role   TEXT        NULL,
  event_type   TEXT        NOT NULL,
  route        TEXT        NULL,
  method       TEXT        NULL,
  ip_address   TEXT        NULL,
  user_agent   TEXT        NULL,
  status       TEXT        NOT NULL DEFAULT 'recorded',
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Admin/ops read access
DROP POLICY IF EXISTS "audit_events_admin_read" ON public.audit_events;
CREATE POLICY "audit_events_admin_read"
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role'
    ) IN ('admin', 'ops_manager')
  );

-- Service role insert (createAdminClient bypasses RLS, but policy documents intent)
DROP POLICY IF EXISTS "audit_events_service_insert" ON public.audit_events;
CREATE POLICY "audit_events_service_insert"
  ON public.audit_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Deny anon entirely
DROP POLICY IF EXISTS "audit_events_deny_anon" ON public.audit_events;
CREATE POLICY "audit_events_deny_anon"
  ON public.audit_events
  FOR ALL
  TO anon
  USING (false);

-- Indexes
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx
  ON public.audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_event_type_idx
  ON public.audit_events (event_type);

CREATE INDEX IF NOT EXISTS audit_events_actor_id_idx
  ON public.audit_events (actor_id);
