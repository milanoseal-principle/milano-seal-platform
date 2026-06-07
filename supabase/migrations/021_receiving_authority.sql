-- 021_receiving_authority.sql
-- Receiving authorities database for destination-country document routing

CREATE TABLE IF NOT EXISTS receiving_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  authority_type TEXT NOT NULL CHECK (authority_type IN ('comune','consulate','embassy','court','university','bank','registry','immigration','corporate_registry','foreign_counsel')),
  country TEXT NOT NULL,
  city TEXT,
  accepted_documents TEXT[],
  language_rules TEXT,
  apostille_required BOOLEAN DEFAULT false,
  legalization_required BOOLEAN DEFAULT false,
  translation_required BOOLEAN DEFAULT false,
  document_age_limit_days INTEGER,
  ron_accepted BOOLEAN DEFAULT false,
  rejection_triggers TEXT[],
  last_successful_matter_id UUID,
  source_confidence TEXT DEFAULT 'UNVERIFIED_REVIEW_REQUIRED' CHECK (source_confidence IN ('VERIFIED_OFFICIAL','VERIFIED_OPERATOR','PARTNER_CONFIRMED','CLIENT_PROVIDED','UNVERIFIED_REVIEW_REQUIRED')),
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE receiving_authorities ENABLE ROW LEVEL SECURITY;

-- Operators and admins can read and write
CREATE POLICY "receiving_authorities_admin_all" ON receiving_authorities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','operator','superadmin','founder_admin','admin_operator','ops_manager')
    )
  );

-- Seed 4 example rows
INSERT INTO receiving_authorities (name, authority_type, country, city, apostille_required, legalization_required, translation_required, ron_accepted, source_confidence)
VALUES
  ('Comune di Roma', 'comune', 'Italy', 'Rome', true, false, true, false, 'VERIFIED_OPERATOR'),
  ('Italian Consulate General - Miami', 'consulate', 'Italy', 'Miami', true, false, true, false, 'VERIFIED_OPERATOR'),
  ('UAE Ministry of Foreign Affairs', 'registry', 'UAE', 'Dubai', true, true, true, false, 'PARTNER_CONFIRMED'),
  ('Florida Division of Corporations', 'registry', 'United States', 'Tallahassee', false, false, false, true, 'VERIFIED_OFFICIAL')
ON CONFLICT DO NOTHING;
