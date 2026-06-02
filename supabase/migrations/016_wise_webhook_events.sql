-- Migration 016: Wise webhook events table
-- DO NOT EXECUTE until operator P0 clearance signed.
-- Required before Wise webhook is registered at https://wise.com/settings/webhooks

CREATE TABLE IF NOT EXISTS wise_webhook_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type          TEXT        NOT NULL,
  event_id            TEXT,
  resource_id         TEXT,
  raw_event           JSONB       NOT NULL DEFAULT '{}',
  idempotency_hash    TEXT        NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wise_webhook_events_event_type     ON wise_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_wise_webhook_events_event_id       ON wise_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_wise_webhook_events_idempotency    ON wise_webhook_events(idempotency_hash);
CREATE INDEX IF NOT EXISTS idx_wise_webhook_events_created_at     ON wise_webhook_events(created_at DESC);

-- RLS: service role only — operators never query this directly
ALTER TABLE wise_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON wise_webhook_events
  USING (auth.role() = 'service_role');
