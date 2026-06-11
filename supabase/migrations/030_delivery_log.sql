CREATE TABLE IF NOT EXISTS delivery_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id        text NOT NULL,
  file_name        text,
  sent_by          text,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  status           text NOT NULL DEFAULT 'sent',
  confirmation_received boolean NOT NULL DEFAULT false,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;
-- No client read — operator/service role only
CREATE INDEX IF NOT EXISTS idx_delivery_logs_matter ON delivery_logs(matter_id);
