-- 006_operational_tables.sql: Operational intelligence tables
-- Milano Seal Platform
-- Apply via: Supabase SQL Editor → New Query → paste and run
--
-- Prerequisite: 005_audit_events.sql must be applied first.

-- ─────────────────────────────────────────────────────────────────────────────
-- follow_ups: Durable follow-up queue (replaces any in-memory setTimeout logic)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_ups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id        UUID NOT NULL,
  cadence_tier     TEXT NOT NULL CHECK (cadence_tier IN ('24h', '72h', '7d', 'manual')),
  channel          TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email', 'manual')),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sent', 'completed', 'stopped', 'failed')),
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_attempt_at  TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  stopped_at       TIMESTAMPTZ,
  stopped_reason   TEXT,
  created_by       UUID,
  assigned_to      UUID,
  scheduled_for    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_matter_id ON follow_ups(matter_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_for ON follow_ups(scheduled_for);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
-- No public policies. Access via service role (server-side) only.

-- ─────────────────────────────────────────────────────────────────────────────
-- sla_breaches: Immutable SLA breach log
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_breaches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id        UUID NOT NULL,
  breach_type      TEXT NOT NULL,
  severity_level   TEXT NOT NULL CHECK (severity_level IN ('warning', 'critical')),
  triggered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_breaches_matter_id ON sla_breaches(matter_id);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_severity ON sla_breaches(severity_level);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_resolved ON sla_breaches(resolved_at);

ALTER TABLE sla_breaches ENABLE ROW LEVEL SECURITY;
-- No public policies. Access via service role only.

-- ─────────────────────────────────────────────────────────────────────────────
-- partner_commissions: Partner payout ledger (internal only — never client-visible)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_commissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id        UUID NOT NULL,
  partner_id       TEXT NOT NULL,
  partner_name     TEXT,
  partner_type     TEXT CHECK (partner_type IN ('attorney', 'partner', 'staff', 'alliance')),
  payout_amount    NUMERIC(10, 2) NOT NULL CHECK (payout_amount >= 0),
  commission_rate  NUMERIC(5, 4),
  commission_status TEXT NOT NULL DEFAULT 'pending'
                     CHECK (commission_status IN ('pending', 'approved', 'paid', 'voided')),
  payout_reference TEXT,
  payout_due_at    TIMESTAMPTZ,
  payout_paid_at   TIMESTAMPTZ,
  ledger_logged_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_matter_id ON partner_commissions(matter_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_status ON partner_commissions(commission_status);

ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
-- No public policies. Internal/admin access via service role only.

-- ─────────────────────────────────────────────────────────────────────────────
-- compliance_checks: Per-matter destination compliance checklist
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_checks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id                UUID NOT NULL,
  jurisdiction_code        TEXT NOT NULL,
  checklist_item_key       TEXT NOT NULL,
  is_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_operator_id  UUID,
  verified_at              TIMESTAMPTZ,
  manual_review            BOOLEAN NOT NULL DEFAULT FALSE,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (matter_id, checklist_item_key)
);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_matter_id ON compliance_checks(matter_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_jurisdiction ON compliance_checks(jurisdiction_code);

ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
-- No public policies. Operator access via service role only.

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER partner_commissions_updated_at
  BEFORE UPDATE ON partner_commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER compliance_checks_updated_at
  BEFORE UPDATE ON compliance_checks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
