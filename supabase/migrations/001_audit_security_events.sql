-- SECURITY-03: Immutable audit and security event tables
-- Milano Seal Platform
-- Apply via: supabase db push or psql against your Supabase project

-- ============================================================
-- audit_events
-- Comprehensive, append-only audit trail for all sensitive
-- operations: deal mutations, file access, payment events,
-- auth actions, admin API calls.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID,                        -- NULL for unauthenticated events
  actor_email   TEXT,
  resource_type TEXT        NOT NULL,        -- deals | files | payments | users | auth | portal
  resource_id   TEXT,                        -- deal_id, file id, user id, etc.
  action        TEXT        NOT NULL,        -- create | read | update | delete | execute | export | login | logout
  old_value     JSONB,                       -- state before change (omit for read/create)
  new_value     JSONB,                       -- state after change (omit for read/delete)
  ip_address    INET,
  user_agent    TEXT,
  status        TEXT        NOT NULL DEFAULT 'success', -- success | failure
  error_msg     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_actor    ON audit_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events (resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_action   ON audit_events (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_created  ON audit_events (created_at DESC);

-- RLS: service-role writes freely; normal sessions insert only; reads restricted to operators
-- (operator role check is enforced at the API layer — see lib/auth-guards.ts)
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_events_service_all" ON audit_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "audit_events_authenticated_insert" ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No authenticated SELECT policy — reads go through the service role via API layer.
-- This prevents clients from directly querying their own audit trail via the anon/user key.

-- ============================================================
-- security_events
-- Security incident log: failed auth, unauthorized access
-- attempts, rate-limit hits, anomalous patterns.
-- ============================================================

CREATE TABLE IF NOT EXISTS security_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     TEXT        NOT NULL,   -- login_failed | unauthorized_access | rate_limit_exceeded | token_reuse | suspicious_activity | role_escalation_attempt
  user_id        UUID,                   -- Supabase auth.users.id if known
  actor_email    TEXT,
  severity       TEXT        NOT NULL,   -- low | medium | high | critical
  details        JSONB,                  -- structured event details
  ip_address     INET,
  user_agent     TEXT,
  remediation    TEXT        NOT NULL DEFAULT 'open', -- open | acknowledged | resolved
  resolved_at    TIMESTAMPTZ,
  resolved_by    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type     ON security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user     ON security_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_open     ON security_events (remediation, created_at DESC)
  WHERE remediation = 'open';

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_events_service_all" ON security_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No direct client reads or inserts. All writes go through service role in API layer.
