-- 001_initial_schema.sql: Baseline schema reconstruction trace
-- Milano Seal Platform
-- Apply via: Supabase SQL Editor → New Query → paste and run
--
-- IMPORTANT: This file reconstructs CREATE TABLE statements from code usage.
-- If the live Supabase database already contains these tables, this migration
-- is safe to apply via IF NOT EXISTS guards — it will not overwrite live data.
-- Tables marked PRODUCTION VERIFIED exist in the live DB; tables marked
-- RECONSTRUCTED are inferred from code references alone.
--
-- Cross-reference: 002_rls_storage_policies.sql assumes these tables exist.

-- ─────────────────────────────────────────────────────────────────────────────
-- deals: Core matter/intake record (PRODUCTION VERIFIED via 002 RLS policies)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id                    TEXT        UNIQUE,
  access_token               TEXT        UNIQUE,
  client_name                TEXT,
  client_type                TEXT        NOT NULL DEFAULT 'individual',
  company_name               TEXT,
  email                      TEXT,
  phone                      TEXT,
  document_type              TEXT,
  use_case                   TEXT,
  destination_country        TEXT,
  origin_state               TEXT,
  apostille_required         BOOLEAN     NOT NULL DEFAULT FALSE,
  docs_count                 INTEGER     NOT NULL DEFAULT 1,
  lane                       TEXT,
  urgency                    TEXT        NOT NULL DEFAULT 'standard',
  mobile                     BOOLEAN     NOT NULL DEFAULT FALSE,
  miles                      NUMERIC(8,2) NOT NULL DEFAULT 0,
  signers                    INTEGER     NOT NULL DEFAULT 1,
  witnesses                  INTEGER     NOT NULL DEFAULT 0,
  witness_type               TEXT,
  after_hours                BOOLEAN     NOT NULL DEFAULT FALSE,
  translation                BOOLEAN     NOT NULL DEFAULT FALSE,
  multi_country              BOOLEAN     NOT NULL DEFAULT FALSE,
  base_price                 NUMERIC(10,2),
  witness_total              NUMERIC(10,2),
  total_price                NUMERIC(10,2),
  invoice_retainer           NUMERIC(10,2),
  invoice_balance            NUMERIC(10,2),
  payment_status             TEXT        NOT NULL DEFAULT 'unpaid'
                               CHECK (payment_status IN ('unpaid','paid','failed','refunded')),
  payment_method             TEXT,
  payment_reference          TEXT,
  payment_link               TEXT,
  payment_amount_received    NUMERIC(10,2),
  payment_failed_at          TIMESTAMPTZ,
  payment_failure_reason     TEXT,
  balance_payment_status     TEXT,
  balance_payment_link       TEXT,
  balance_paid_at            TIMESTAMPTZ,
  balance_amount_received    NUMERIC(10,2),
  deal_status                TEXT        NOT NULL DEFAULT 'new'
                               CHECK (deal_status IN (
                                 'new','reviewing','quoted','awaiting_payment',
                                 'scheduled','in_execution','apostille','shipped',
                                 'completed','lost'
                               )),
  scheduled_at               TIMESTAMPTZ,
  executed_at                TIMESTAMPTZ,
  apostille_at               TIMESTAMPTZ,
  shipped_at                 TIMESTAMPTZ,
  completed_at               TIMESTAMPTZ,
  tracking_number            TEXT,
  courier_carrier            TEXT,
  courier_tracking_id        TEXT,
  conversion_score           NUMERIC(5,2),
  priority_score             NUMERIC(5,2),
  priority_tier              TEXT,
  sla_deadline               TIMESTAMPTZ,
  last_activity              TIMESTAMPTZ,
  assignee                   TEXT,
  assigned_lane              TEXT,
  notes                      TEXT,
  internal_notes             TEXT,
  operator_notes             TEXT,
  has_messages               BOOLEAN     NOT NULL DEFAULT FALSE,
  is_paid_and_released       BOOLEAN     NOT NULL DEFAULT FALSE,
  loss_reason                TEXT,
  lost_stage                 TEXT,
  lost_notes_internal        TEXT,
  competitor_name            TEXT,
  lost_at                    TIMESTAMPTZ,
  relationship_tier          TEXT
    CHECK (relationship_tier IN ('standard','priority','vip','strategic')),
  referred_by                TEXT,
  attorney_link              TEXT,
  client_lifetime_value      NUMERIC(10,2),
  repeat_client              BOOLEAN     NOT NULL DEFAULT FALSE,
  trust_level                TEXT
    CHECK (trust_level IN ('new','verified','trusted','strategic')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_deal_id          ON deals(deal_id);
CREATE INDEX IF NOT EXISTS idx_deals_email            ON deals(email);
CREATE INDEX IF NOT EXISTS idx_deals_deal_status      ON deals(deal_status);
CREATE INDEX IF NOT EXISTS idx_deals_payment_status   ON deals(payment_status);
CREATE INDEX IF NOT EXISTS idx_deals_access_token     ON deals(access_token);
CREATE INDEX IF NOT EXISTS idx_deals_created_at       ON deals(created_at DESC);
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS payments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id             UUID        NOT NULL,
  wise_reference        TEXT        NOT NULL,
  payment_type          TEXT        NOT NULL DEFAULT 'retainer'
                          CHECK (payment_type IN ('retainer','balance','full')),
  payment_amount        NUMERIC(10,2) NOT NULL,
  payment_currency      TEXT        NOT NULL DEFAULT 'USD',
  payment_status        TEXT        NOT NULL DEFAULT 'awaiting_payment'
                          CHECK (payment_status IN (
                            'awaiting_payment','payment_pending','payment_confirmed',
                            'payment_failed','partially_paid','refunded'
                          )),
  payment_confirmed     BOOLEAN     NOT NULL DEFAULT FALSE,
  payer_name            TEXT,
  payer_email           TEXT,
  paid_at               TIMESTAMPTZ,
  webhook_received_at   TIMESTAMPTZ,
  webhook_payload       JSONB,
  webhook_signature     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_matter_id      ON payments(matter_id);
CREATE INDEX IF NOT EXISTS idx_payments_wise_reference ON payments(wise_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status         ON payments(payment_status);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID        NOT NULL,
  direction    TEXT        NOT NULL DEFAULT 'outbound'
                 CHECK (direction IN ('inbound','outbound')),
  channel      TEXT        NOT NULL DEFAULT 'portal'
                 CHECK (channel IN ('portal','sms','email','whatsapp','manual')),
  content      TEXT        NOT NULL,
  sender_role  TEXT,
  sender_name  TEXT,
  status       TEXT        NOT NULL DEFAULT 'received'
                 CHECK (status IN ('received','sent','failed','pending')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_deal_id    ON messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS custody_ledger (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID        NOT NULL,
  event        TEXT        NOT NULL,
  actor_type   TEXT        NOT NULL DEFAULT 'system'
                 CHECK (actor_type IN ('system','operator','client','courier','alliance')),
  actor_name   TEXT,
  location     TEXT,
  notes        TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custody_ledger_deal_id    ON custody_ledger(deal_id);
CREATE INDEX IF NOT EXISTS idx_custody_ledger_created_at ON custody_ledger(created_at DESC);
ALTER TABLE custody_ledger ENABLE ROW LEVEL SECURITY;

-- Required by migration 002. These baseline tables must exist before policies.
CREATE TABLE IF NOT EXISTS files (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID        NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  filename     TEXT        NOT NULL,
  file_url     TEXT,
  file_path    TEXT,
  storage_path TEXT,
  file_type    TEXT,
  file_size    BIGINT,
  uploaded_by  TEXT        NOT NULL DEFAULT 'client',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_files_deal_id ON files(deal_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    UUID        REFERENCES deals(id) ON DELETE SET NULL,
  actor      TEXT,
  action     TEXT        NOT NULL,
  detail     TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_deal_id ON activity_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS compliance_rules (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction        TEXT        NOT NULL UNIQUE,
  jurisdiction_type   TEXT        NOT NULL DEFAULT 'country',
  ron_allowed         BOOLEAN     NOT NULL DEFAULT FALSE,
  apostille_required  BOOLEAN     NOT NULL DEFAULT FALSE,
  witnesses_required  BOOLEAN     NOT NULL DEFAULT FALSE,
  witness_count       INTEGER     NOT NULL DEFAULT 0,
  hague_member        BOOLEAN     NOT NULL DEFAULT FALSE,
  restrictions        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes               TEXT,
  execution_path      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  source_url           TEXT,
  verified_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_jurisdiction ON compliance_rules(jurisdiction);
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS security_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT        NOT NULL,
  actor        TEXT,
  ip_address   TEXT,
  resource     TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS portal_otps (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID        NOT NULL,
  email        TEXT        NOT NULL,
  otp          TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_otps_deal_id ON portal_otps(deal_id);
ALTER TABLE portal_otps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deals_updated_at ON deals;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
