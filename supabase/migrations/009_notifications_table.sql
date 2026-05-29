-- 009_notifications_table.sql
-- Creates the notifications table required by /api/intake and other transactional
-- notification flows. This table was referenced in code but missing from migrations,
-- causing a fatal runtime error on intake submission.

CREATE TABLE IF NOT EXISTS notifications (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id             UUID        REFERENCES deals(id) ON DELETE CASCADE,
  recipient_email     TEXT,
  recipient_phone     TEXT,
  channel             TEXT        NOT NULL DEFAULT 'email',
  type                TEXT        NOT NULL,
  subject             TEXT,
  message             TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending',
  provider            TEXT,
  provider_message_id TEXT,
  error_message       TEXT,
  metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at             TIMESTAMPTZ,
  read_at             TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS notifications_deal_id_idx    ON notifications(deal_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx     ON notifications(status);
CREATE INDEX IF NOT EXISTS notifications_type_idx       ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role has full access (all server-side operations use service role)
CREATE POLICY "service_role_full_access" ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Operators and admins can read notifications for their deals
-- Uses the same RBAC pattern as other operator-gated tables
CREATE POLICY "operators_read_notifications" ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = notifications.deal_id
    )
    AND (
      auth.jwt() ->> 'email' = ANY(
        string_to_array(current_setting('app.operator_emails', true), ',')
      )
      OR
      auth.jwt() ->> 'email' = ANY(
        string_to_array(current_setting('app.admin_emails', true), ',')
      )
    )
  );

-- Clients must not read notifications directly — portal uses portal_otps and deal views
-- No client-facing policy added intentionally.

COMMENT ON TABLE notifications IS
  'Transactional notification log. Records every email/SMS notification dispatched '
  'by the platform. Used for delivery tracking, deduplication, and audit purposes.';
