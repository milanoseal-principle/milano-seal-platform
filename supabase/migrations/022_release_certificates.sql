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
  -- Actor identity is the auth.users UUID. Do not depend on a separate
  -- public.profiles table that is not part of the canonical migration chain.
  issued_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE release_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "release_certificates_operator_all" ON release_certificates;
CREATE POLICY "release_certificates_operator_all" ON release_certificates
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager','execution_coordinator','apostille_coordinator')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager','execution_coordinator','apostille_coordinator')
  );

DROP POLICY IF EXISTS "release_certificates_service_all" ON release_certificates;
CREATE POLICY "release_certificates_service_all" ON release_certificates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read for verification — safe fields only enforced at API layer.
DROP POLICY IF EXISTS "release_certificates_public_read" ON release_certificates;
CREATE POLICY "release_certificates_public_read" ON release_certificates
  FOR SELECT
  USING (status = 'valid');
