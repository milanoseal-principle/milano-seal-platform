-- Migration 022: Release Certificates
-- Public-verifiable custody release records

CREATE TABLE IF NOT EXISTS release_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_hash TEXT UNIQUE NOT NULL,
  matter_id UUID NOT NULL,
  display_id TEXT NOT NULL,
  release_date TIMESTAMPTZ NOT NULL,
  document_count INTEGER,
  custody_status TEXT CHECK (custody_status IN ('valid','revoked','expired')) DEFAULT 'valid',
  released_by TEXT, -- operator display name only, no user ID exposed
  release_method TEXT, -- "secure_courier" | "digital_release" | "in_person"
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Never store: client documents, internal notes, label URLs, costs, raw events
  CONSTRAINT fk_matter FOREIGN KEY (matter_id) REFERENCES deals(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_release_certs_hash ON release_certificates(verification_hash);
CREATE INDEX IF NOT EXISTS idx_release_certs_matter ON release_certificates(matter_id);

-- Public can verify (read only — no auth required for public verify page)
ALTER TABLE release_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_verify_release_certificate"
  ON release_certificates FOR SELECT
  USING (true);

CREATE POLICY "dashboard_create_release_certificate"
  ON release_certificates FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('founder_admin','admin','admin_operator'));
