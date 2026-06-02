-- Migration 015: Shippo Custody Layer
-- DO NOT EXECUTE until P0 remote clearance is signed by operator.
-- Apply with: supabase db push OR psql -f this file against the target database.

-- Shipments table — label_url stored here, NEVER exposed via portal API
CREATE TABLE IF NOT EXISTS shippo_shipments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id                 uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  shippo_shipment_id        text,
  shippo_transaction_id     text,
  shippo_rate_id            text,
  carrier                   text,
  service_level             text,
  tracking_number           text,
  tracking_url              text,
  label_url                 text,             -- OPERATOR ONLY. Never expose via portal.
  label_file_type           text DEFAULT 'PDF',
  shippo_status             text,
  courier_status            text DEFAULT 'UNKNOWN',
  address_from              jsonb NOT NULL DEFAULT '{}'::jsonb,
  address_to                jsonb NOT NULL DEFAULT '{}'::jsonb,
  parcel                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  customs_declaration_id    text,
  customs_required          boolean DEFAULT false,
  label_created_at          timestamptz,
  tracking_registered_at    timestamptz,
  delivered_at              timestamptz,
  returned_at               timestamptz,
  exception_at              timestamptz,
  created_by                uuid,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shippo_shipments_matter_id ON shippo_shipments(matter_id);
CREATE INDEX IF NOT EXISTS idx_shippo_shipments_tracking_number ON shippo_shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shippo_shipments_courier_status ON shippo_shipments(courier_status);

-- Tracking events — append-only, idempotency via event_hash
CREATE TABLE IF NOT EXISTS shippo_tracking_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id             uuid REFERENCES deals(id) ON DELETE CASCADE,
  shippo_shipment_id    text,
  shippo_transaction_id text,
  carrier               text,
  tracking_number       text,
  status                text,
  substatus_code        text,
  substatus_text        text,
  action_required       boolean DEFAULT false,
  status_details        text,
  status_date           timestamptz,
  location              jsonb DEFAULT '{}'::jsonb,
  raw_event             jsonb DEFAULT '{}'::jsonb,  -- OPERATOR ONLY. Never expose via portal.
  event_hash            text UNIQUE,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shippo_tracking_events_matter_id ON shippo_tracking_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_shippo_tracking_events_tracking_number ON shippo_tracking_events(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shippo_tracking_events_status ON shippo_tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_shippo_tracking_events_created_at ON shippo_tracking_events(created_at);

-- RLS: operator/admin only. Portal reads through /api/portal/me/courier only.
ALTER TABLE shippo_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippo_tracking_events ENABLE ROW LEVEL SECURITY;

-- Service role bypass (webhook + server-side writes)
CREATE POLICY "service_role_shippo_shipments" ON shippo_shipments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_shippo_tracking_events" ON shippo_tracking_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
