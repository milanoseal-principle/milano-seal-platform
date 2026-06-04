-- Migration 021: Receiving Authority Database
-- Internal operator-only registry of receiving authorities worldwide

CREATE TABLE IF NOT EXISTS receiving_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_name TEXT NOT NULL,
  authority_type TEXT NOT NULL CHECK (authority_type IN ('apostille','consulate','embassy','court','university','bank','registry','immigration','corporate_registry','foreign_counsel')),
  country TEXT NOT NULL,
  city TEXT,
  address TEXT,
  accepted_document_types TEXT[],
  language_requirements TEXT[],
  apostille_required BOOLEAN,
  legalization_required BOOLEAN,
  translation_required BOOLEAN,
  document_age_limit_days INTEGER,
  ron_accepted TEXT CHECK (ron_accepted IN ('yes','no','unknown')) DEFAULT 'unknown',
  rejection_triggers TEXT[],
  last_successful_matter_id UUID,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('official_gov','consulate','hague_bureau','operator_verified','manual')) DEFAULT 'manual',
  confidence_level TEXT CHECK (confidence_level IN ('HIGH','MEDIUM','LOW','UNVERIFIED')) DEFAULT 'UNVERIFIED',
  last_verified_at TIMESTAMPTZ,
  verified_by TEXT CHECK (verified_by IN ('operator','auto')) DEFAULT 'operator',
  stale_after_days INTEGER DEFAULT 90,
  manual_review_required BOOLEAN DEFAULT false,
  routing_status TEXT CHECK (routing_status IN ('ACTIVE','MANUAL_REVIEW','SUSPENDED','UNKNOWN')) DEFAULT 'UNKNOWN',
  operator_notes TEXT, -- internal only, never exposed to client/VA
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receiving_authorities_country ON receiving_authorities(country);
CREATE INDEX IF NOT EXISTS idx_receiving_authorities_type ON receiving_authorities(authority_type);
CREATE INDEX IF NOT EXISTS idx_receiving_authorities_routing ON receiving_authorities(routing_status);

-- RLS: only dashboard roles can read/write
ALTER TABLE receiving_authorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_read_receiving_authorities"
  ON receiving_authorities FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator'));

CREATE POLICY "dashboard_write_receiving_authorities"
  ON receiving_authorities FOR ALL
  USING (auth.jwt() ->> 'role' IN ('founder_admin','admin','admin_operator'));

-- Seed well-known entries
INSERT INTO receiving_authorities (authority_name, authority_type, country, apostille_required, legalization_required, translation_required, ron_accepted, source_type, confidence_level, routing_status)
VALUES
  ('Florida Secretary of State', 'apostille', 'United States', false, false, false, 'yes', 'official_gov', 'HIGH', 'ACTIVE'),
  ('Italian Consulate General Miami', 'consulate', 'Italy', true, false, true, 'unknown', 'operator_verified', 'MEDIUM', 'ACTIVE'),
  ('UAE Ministry of Foreign Affairs', 'consulate', 'United Arab Emirates', false, true, true, 'no', 'manual', 'LOW', 'MANUAL_REVIEW'),
  ('Mexico City Notaría Pública', 'court', 'Mexico', true, false, true, 'unknown', 'manual', 'LOW', 'MANUAL_REVIEW')
ON CONFLICT DO NOTHING;
