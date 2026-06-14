-- Discount / Courtesy Code Engine
-- Founder-controlled only. VA and operators cannot create or modify.

CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'waive_service_fee', 'courtesy')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL DEFAULT 'founder',
  notes text,
  deal_id_restriction uuid REFERENCES deals(id) ON DELETE SET NULL,
  single_use boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  redeemed_by text,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  discount_applied numeric NOT NULL DEFAULT 0,
  original_amount numeric,
  final_amount numeric,
  notes text
);

-- RLS: only authenticated (operator) can read; founder-flagged writes enforced in API layer
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_discount_codes_read" ON discount_codes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "operator_discount_codes_write" ON discount_codes
  FOR ALL TO authenticated USING (true);

CREATE POLICY "operator_discount_redemptions" ON discount_redemptions
  FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code_id ON discount_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_deal_id ON discount_redemptions(deal_id);

-- Auto-update
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_discount_codes_updated_at();
