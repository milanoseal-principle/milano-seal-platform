-- ─────────────────────────────────────────────────────────────────────────────
-- 018_bluenotary_ron.sql
-- BlueNotary Remote Online Notarization (RON-01)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ron_sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ron_sessions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id                uuid NOT NULL,
  notarization_id          text UNIQUE NOT NULL,
  bn_session_id            text UNIQUE,
  signing_type             text DEFAULT 'ron',
  session_type             text,
  notarization_timing_type text,
  session_timing           timestamptz,
  blue_notary_status       text DEFAULT 'DRAFT',
  milano_ron_status        text DEFAULT 'RON_DRAFT',
  identity_status          text DEFAULT 'NOT_STARTED',
  kba_status               text DEFAULT 'NOT_STARTED',
  biometric_status         text DEFAULT 'NOT_STARTED',
  document_tagging_status  text DEFAULT 'PENDING',
  payment_gate_status      text DEFAULT 'LOCKED',
  session_url_status       text DEFAULT 'NOT_RELEASED',
  final_documents_status   text DEFAULT 'NOT_AVAILABLE',
  created_by               uuid,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  scheduled_at             timestamptz,
  started_at               timestamptz,
  completed_at             timestamptz,
  expired_at               timestamptz,
  raw_session              jsonb DEFAULT '{}'
);

ALTER TABLE ron_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ron_sessions_admin_full" ON ron_sessions
  FOR ALL USING (
    (auth.jwt() ->> 'role') IN ('admin','founder_admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')
  );

CREATE POLICY "ron_sessions_finance_read" ON ron_sessions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'finance'
  );

CREATE POLICY "ron_sessions_client_read" ON ron_sessions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'client'
    AND matter_id IN (
      SELECT id FROM deals WHERE email = auth.email()
    )
  );

CREATE POLICY "ron_sessions_va_read" ON ron_sessions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'va'
    AND matter_id IN (
      SELECT deal_id FROM va_assignments WHERE va_user_id = auth.uid()
    )
  );

-- ── ron_signers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ron_signers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ron_session_id        uuid REFERENCES ron_sessions(id) ON DELETE CASCADE,
  matter_id             uuid,
  signer_index          integer,
  first_name            text,
  middle_name           text,
  last_name             text,
  email                 text,
  phone                 text,
  state                 text,
  authentication_type   text,
  signing_url_encrypted text,
  signing_url_released  boolean DEFAULT false,
  identity_status       text DEFAULT 'NOT_STARTED',
  kba_status            text DEFAULT 'NOT_STARTED',
  biometric_status      text DEFAULT 'NOT_STARTED',
  joined_at             timestamptz,
  left_at               timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE ron_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ron_signers_admin_full" ON ron_signers
  FOR ALL USING (
    (auth.jwt() ->> 'role') IN ('admin','founder_admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')
  );

CREATE POLICY "ron_signers_finance_read" ON ron_signers
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'finance'
  );

CREATE POLICY "ron_signers_client_read" ON ron_signers
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'client'
    AND email = auth.email()
    AND signing_url_released = true
  );

CREATE POLICY "ron_signers_va_read" ON ron_signers
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'va'
    AND matter_id IN (
      SELECT deal_id FROM va_assignments WHERE va_user_id = auth.uid()
    )
  );

-- ── ron_documents ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ron_documents (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ron_session_id              uuid REFERENCES ron_sessions(id) ON DELETE CASCADE,
  matter_id                   uuid,
  document_id                 uuid,
  document_name               text,
  document_type               text,
  blue_notary_document_name   text,
  template_id                 text,
  smart_tags_applied          boolean DEFAULT false,
  uploaded_to_bluenotary      boolean DEFAULT false,
  signed_document_received    boolean DEFAULT false,
  storage_path                text,
  signed_storage_path         text,
  document_status             text DEFAULT 'PENDING',
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

ALTER TABLE ron_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ron_documents_admin_full" ON ron_documents
  FOR ALL USING (
    (auth.jwt() ->> 'role') IN ('admin','founder_admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator')
  );

CREATE POLICY "ron_documents_finance_read" ON ron_documents
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'finance'
  );

CREATE POLICY "ron_documents_client_read" ON ron_documents
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'client'
    AND matter_id IN (
      SELECT id FROM deals WHERE email = auth.email()
    )
    AND signed_document_received = true
  );

CREATE POLICY "ron_documents_va_read" ON ron_documents
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'va'
    AND matter_id IN (
      SELECT deal_id FROM va_assignments WHERE va_user_id = auth.uid()
    )
  );

-- ── ron_webhook_events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ron_webhook_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash       text UNIQUE NOT NULL,
  notarization_id  text,
  bn_session_id    text,
  event_type       text NOT NULL,
  event_message    text,
  event_by_email   text,
  event_by_name    text,
  matter_id        uuid,
  ron_session_id   uuid,
  processed        boolean DEFAULT false,
  processing_error text,
  raw_payload      jsonb DEFAULT '{}',
  received_at      timestamptz DEFAULT now(),
  processed_at     timestamptz
);

ALTER TABLE ron_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ron_webhook_events_admin_full" ON ron_webhook_events
  FOR ALL USING (
    (auth.jwt() ->> 'role') IN ('admin','founder_admin','admin_operator','ops_manager','execution_coordinator')
  );

-- ── ron_audit_events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ron_audit_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id      uuid,
  ron_session_id uuid,
  event_type     text NOT NULL,
  description    text,
  actor_id       uuid,
  actor_role     text,
  source         text DEFAULT 'milano_seal',
  created_at     timestamptz DEFAULT now(),
  metadata       jsonb DEFAULT '{}'
);

ALTER TABLE ron_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ron_audit_events_admin_full" ON ron_audit_events
  FOR ALL USING (
    (auth.jwt() ->> 'role') IN ('admin','founder_admin','admin_operator','ops_manager','execution_coordinator')
  );

CREATE POLICY "ron_audit_events_finance_read" ON ron_audit_events
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'finance'
  );

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ron_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER ron_sessions_updated_at
  BEFORE UPDATE ON ron_sessions
  FOR EACH ROW EXECUTE FUNCTION update_ron_updated_at();

CREATE TRIGGER ron_signers_updated_at
  BEFORE UPDATE ON ron_signers
  FOR EACH ROW EXECUTE FUNCTION update_ron_updated_at();

CREATE TRIGGER ron_documents_updated_at
  BEFORE UPDATE ON ron_documents
  FOR EACH ROW EXECUTE FUNCTION update_ron_updated_at();

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ron_sessions_matter_id        ON ron_sessions(matter_id);
CREATE INDEX IF NOT EXISTS idx_ron_sessions_notarization_id  ON ron_sessions(notarization_id);
CREATE INDEX IF NOT EXISTS idx_ron_sessions_milano_status    ON ron_sessions(milano_ron_status);
CREATE INDEX IF NOT EXISTS idx_ron_signers_session           ON ron_signers(ron_session_id);
CREATE INDEX IF NOT EXISTS idx_ron_signers_email             ON ron_signers(email);
CREATE INDEX IF NOT EXISTS idx_ron_documents_session         ON ron_documents(ron_session_id);
CREATE INDEX IF NOT EXISTS idx_ron_webhook_events_hash       ON ron_webhook_events(event_hash);
CREATE INDEX IF NOT EXISTS idx_ron_webhook_events_notariz    ON ron_webhook_events(notarization_id);
CREATE INDEX IF NOT EXISTS idx_ron_audit_events_matter       ON ron_audit_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_ron_audit_events_session      ON ron_audit_events(ron_session_id);
