-- Persist provider-backed rate evidence before Wise payment while preserving the
-- same shipment row through label, tracking, and delivery.

ALTER TABLE shippo_shipments
  ADD COLUMN IF NOT EXISTS provider_rate_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tier_courier_credit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS client_courier_charge NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS rate_currency TEXT,
  ADD COLUMN IF NOT EXISTS selected_service_level TEXT,
  ADD COLUMN IF NOT EXISTS selection_policy TEXT,
  ADD COLUMN IF NOT EXISTS selection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rate_selected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rate_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_snapshot_hash TEXT,
  ADD COLUMN IF NOT EXISTS rate_status TEXT,
  ADD COLUMN IF NOT EXISTS selected_by UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shippo_shipments_matter_provider_shipment
  ON shippo_shipments(matter_id, shippo_shipment_id)
  WHERE shippo_shipment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shippo_shipments_rate_status
  ON shippo_shipments(rate_status);
