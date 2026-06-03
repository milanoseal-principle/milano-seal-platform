-- Migration 016: Wise payment gate schema
-- DO NOT EXECUTE until operator P0 clearance signed.
-- Required before:
--   1. Wise webhook is registered at https://wise.com/settings/webhooks
--   2. First live payment is processed

-- ─────────────────────────────────────────────────────────────────────────────
-- wise_payment_intents — canonical Wise payment record per matter
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wise_payment_intents (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id           UUID        NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  invoice_id          UUID        NULL,
  wise_profile_id     TEXT,
  wise_transfer_id    TEXT,
  wise_quote_id       TEXT,
  wise_reference      TEXT        NOT NULL UNIQUE,
  amount_due          NUMERIC(10,2) NOT NULL,
  amount_paid         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency            TEXT        NOT NULL DEFAULT 'USD',
  payment_status      TEXT        NOT NULL DEFAULT 'AWAITING_PAYMENT'
                        CHECK (payment_status IN (
                          'AWAITING_PAYMENT',
                          'PAYMENT_PENDING',
                          'PAYMENT_CONFIRMED',
                          'PAYMENT_RECONCILED',
                          'PAYMENT_FAILED',
                          'PAYMENT_REFUNDED',
                          'PAYMENT_REVIEW_REQUIRED',
                          'PARTIAL_PAYMENT'
                        )),
  payment_url         TEXT,
  payment_instructions JSONB      NOT NULL DEFAULT '{}',
  payment_method      TEXT        NOT NULL DEFAULT 'WISE',
  environment         TEXT        NOT NULL DEFAULT 'sandbox',
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ,
  reconciled_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wpi_matter_id      ON wise_payment_intents(matter_id);
CREATE INDEX IF NOT EXISTS idx_wpi_wise_reference  ON wise_payment_intents(wise_reference);
CREATE INDEX IF NOT EXISTS idx_wpi_payment_status  ON wise_payment_intents(payment_status);

ALTER TABLE wise_payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator_only_wpi" ON wise_payment_intents
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- wise_webhook_events — every inbound Wise webhook, verified or not
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wise_webhook_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id         TEXT        UNIQUE,
  subscription_id     TEXT,
  event_type          TEXT        NOT NULL,
  schema_version      TEXT,
  signature_valid     BOOLEAN     NOT NULL DEFAULT FALSE,
  test_notification   BOOLEAN     NOT NULL DEFAULT FALSE,
  environment         TEXT        NOT NULL DEFAULT 'sandbox',
  resource_type       TEXT,
  resource_id         TEXT,
  current_state       TEXT,
  previous_state      TEXT,
  occurred_at         TIMESTAMPTZ,
  raw_payload         JSONB       NOT NULL DEFAULT '{}',
  processed           BOOLEAN     NOT NULL DEFAULT FALSE,
  processing_error    TEXT,
  idempotency_hash    TEXT        UNIQUE,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wwe_delivery_id    ON wise_webhook_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_wwe_event_type     ON wise_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_wwe_resource_id    ON wise_webhook_events(resource_id);
CREATE INDEX IF NOT EXISTS idx_wwe_current_state  ON wise_webhook_events(current_state);
CREATE INDEX IF NOT EXISTS idx_wwe_processed      ON wise_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_wwe_received_at    ON wise_webhook_events(received_at DESC);

ALTER TABLE wise_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_wwe" ON wise_webhook_events
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- payment_gate_audit — every blocked or passed gate attempt
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_gate_audit (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id           UUID        REFERENCES deals(id) ON DELETE CASCADE,
  attempted_action    TEXT        NOT NULL,
  gate_status         TEXT        NOT NULL,
  amount_due          NUMERIC(10,2),
  amount_paid         NUMERIC(10,2),
  payment_status      TEXT,
  blocked_reason      TEXT,
  actor_id            UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pga_matter_id      ON payment_gate_audit(matter_id);
CREATE INDEX IF NOT EXISTS idx_pga_gate_status    ON payment_gate_audit(gate_status);
CREATE INDEX IF NOT EXISTS idx_pga_created_at     ON payment_gate_audit(created_at DESC);

ALTER TABLE payment_gate_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator_only_pga" ON payment_gate_audit
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- wise_reconciliation_runs — audit log for reconciliation jobs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wise_reconciliation_runs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at         TIMESTAMPTZ,
  environment         TEXT        NOT NULL DEFAULT 'sandbox',
  status              TEXT        NOT NULL DEFAULT 'RUNNING',
  payments_checked    INTEGER     DEFAULT 0,
  mismatches_found    INTEGER     DEFAULT 0,
  notes               TEXT
);

ALTER TABLE wise_reconciliation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator_only_wrr" ON wise_reconciliation_runs
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- Add columns to deals if not present
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS amount_due            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS amount_paid           NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wise_reference        TEXT,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at  TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-level payment gate trigger
-- Prevents matter from advancing to scheduled or later without payment
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_payment_gate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.matter_status IN (
    'scheduled', 'in_execution', 'apostille_processing',
    'in_transit', 'delivered', 'released', 'completed'
  ) AND OLD.matter_status NOT IN (
    'scheduled', 'in_execution', 'apostille_processing',
    'in_transit', 'delivered', 'released', 'completed'
  ) THEN
    IF COALESCE(NEW.amount_paid, 0) < COALESCE(NEW.amount_due, 0) THEN
      RAISE EXCEPTION 'PAYMENT_REQUIRED: matter cannot advance to % — amount_paid (%) < amount_due (%)',
        NEW.matter_status, COALESCE(NEW.amount_paid, 0), COALESCE(NEW.amount_due, 0);
    END IF;
    IF NEW.payment_status NOT IN ('paid') THEN
      RAISE EXCEPTION 'PAYMENT_REQUIRED: matter cannot advance to % — payment_status is %',
        NEW.matter_status, COALESCE(NEW.payment_status, 'null');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_payment_gate ON deals;
CREATE TRIGGER enforce_payment_gate
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_gate();
