-- Migration 017: Shippo packaging policy fields on shippo_shipments
-- DO NOT EXECUTE until operator P0 clearance signed.
-- Extends migration 015 (shippo_custody) with packaging, QA, tax, and cost fields.

ALTER TABLE shippo_shipments
  ADD COLUMN IF NOT EXISTS shipping_option_id        TEXT,
  ADD COLUMN IF NOT EXISTS package_template_id       TEXT,
  ADD COLUMN IF NOT EXISTS package_length            NUMERIC,
  ADD COLUMN IF NOT EXISTS package_width             NUMERIC,
  ADD COLUMN IF NOT EXISTS package_height            NUMERIC,
  ADD COLUMN IF NOT EXISTS package_weight            NUMERIC,
  ADD COLUMN IF NOT EXISTS package_distance_unit     TEXT DEFAULT 'in',
  ADD COLUMN IF NOT EXISTS package_mass_unit         TEXT DEFAULT 'lb',
  ADD COLUMN IF NOT EXISTS tax_id_policy             TEXT DEFAULT 'NO_TAX_ID'
                             CHECK (tax_id_policy IN (
                               'NO_TAX_ID','VAT','IOSS','EIN','OPERATOR_REVIEW'
                             )),
  ADD COLUMN IF NOT EXISTS carrier_policy_status     TEXT,
  ADD COLUMN IF NOT EXISTS carrier_override_approved_by   UUID,
  ADD COLUMN IF NOT EXISTS carrier_override_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS packaging_qa_status       TEXT DEFAULT 'PENDING'
                             CHECK (packaging_qa_status IN (
                               'PENDING','REVIEWED','FAILED','NOT_REQUIRED'
                             )),
  ADD COLUMN IF NOT EXISTS packaging_qa_checked_by   UUID,
  ADD COLUMN IF NOT EXISTS packaging_qa_checked_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_shippo_cost        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shippo_currency           TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS margin_impact             NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_shippo_shipments_package_qa
  ON shippo_shipments(packaging_qa_status);

CREATE INDEX IF NOT EXISTS idx_shippo_shipments_tax_policy
  ON shippo_shipments(tax_id_policy);
