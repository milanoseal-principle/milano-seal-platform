-- 022_release_certificates.sql
-- Release certificates with public verification support

CREATE TABLE IF NOT EXISTS release_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  verification_id TEXT UNIQUE NOT NULL,
  verification_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','revoked','expired')),
  document_count INTEGER DEFAULT 0,
  destination_country TEXT,
  document_type TEXT,
  release_date TIMESTAMPTZ,
  public_summary TEXT,
  issued_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE release_certificates ENABLE ROW LEVEL SECURITY;

-- Operators can create and manage
CREATE POLICY "release_certificates_operator_all" ON release_certificates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','operator','superadmin','founder_admin','admin_operator','ops_manager')
    )
  );

-- Public read for verification — safe fields only enforced at API layer
CREATE POLICY "release_certificates_public_read" ON release_certificates
  FOR SELECT
  USING (status = 'valid');
