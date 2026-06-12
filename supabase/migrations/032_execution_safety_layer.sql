-- 032_execution_safety_layer.sql
-- Milano Seal Execution Safety Layer
-- Payment Integrity Gate / Identifier Lock / Final Seal Review / Legacy Client Credit

-- ── execution_safety_checks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS execution_safety_checks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id      text        NOT NULL,
  check_key      text        NOT NULL,
  check_label    text        NOT NULL,
  status         text        NOT NULL DEFAULT 'needs_review',
  severity       text        NOT NULL DEFAULT 'standard',
  client_safe_message text,
  operator_note  text,
  reviewed_by    text,
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE execution_safety_checks ENABLE ROW LEVEL SECURITY;

-- Operators/admins can read and write all checks
CREATE POLICY "ops_full_access_safety_checks"
  ON execution_safety_checks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── identifier_locks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS identifier_locks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id        text        NOT NULL,
  identifier_type  text        NOT NULL,
  source_value     text        NOT NULL,
  final_value      text,
  match_status     text        NOT NULL DEFAULT 'pending',
  mismatch_reason  text,
  locked_by        text,
  locked_at        timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identifier_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_full_access_identifier_locks"
  ON identifier_locks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── legacy_client_credits ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legacy_client_credits (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email     text        NOT NULL,
  client_name      text,
  credit_name      text        NOT NULL DEFAULT 'First Client Legacy Courtesy Credit',
  discount_percent numeric     NOT NULL DEFAULT 50,
  applies_to       text        NOT NULL DEFAULT 'service_fee_only',
  status           text        NOT NULL DEFAULT 'active',
  client_safe_note text,
  internal_reason  text,
  created_by       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  used_at          timestamptz,
  matter_id_used   text
);

ALTER TABLE legacy_client_credits ENABLE ROW LEVEL SECURITY;

-- Clients can read their own credit by email — safe fields only via API projection
CREATE POLICY "client_read_own_credit"
  ON legacy_client_credits
  FOR SELECT
  USING (client_email = auth.jwt()->>'email');

-- Operators full access
CREATE POLICY "ops_full_access_credits"
  ON legacy_client_credits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── final_release_reviews ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_release_reviews (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id            text        NOT NULL,
  release_type         text        NOT NULL DEFAULT 'apostille',
  status               text        NOT NULL DEFAULT 'blocked',
  required_checks      jsonb       NOT NULL DEFAULT '[]',
  passed_checks        jsonb       NOT NULL DEFAULT '[]',
  blocked_checks       jsonb       NOT NULL DEFAULT '[]',
  founder_approved_by  text,
  founder_approved_at  timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE final_release_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_full_access_final_reviews"
  ON final_release_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_safety_checks_matter  ON execution_safety_checks(matter_id);
CREATE INDEX IF NOT EXISTS idx_id_locks_matter        ON identifier_locks(matter_id);
CREATE INDEX IF NOT EXISTS idx_legacy_credits_email   ON legacy_client_credits(client_email);
CREATE INDEX IF NOT EXISTS idx_final_reviews_matter   ON final_release_reviews(matter_id);
