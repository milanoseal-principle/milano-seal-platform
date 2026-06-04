CREATE TABLE IF NOT EXISTS partner_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN (
    'identity_confirmed',
    'service_scope_reviewed',
    'document_handling_attested',
    'client_communication_attested',
    'referral_routing_confirmed',
    'security_attestation_signed',
    'compliance_acknowledgement_signed'
  )),
  status TEXT NOT NULL CHECK (status IN ('pending','complete')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  attested_text TEXT,
  operator_confirmed BOOLEAN DEFAULT false,
  operator_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, step)
);

ALTER TABLE partner_certifications ENABLE ROW LEVEL SECURITY;

-- Partners can see their own certification steps
CREATE POLICY "partner_read_own_certification"
  ON partner_certifications FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can update their own pending steps
CREATE POLICY "partner_update_own_certification"
  ON partner_certifications FOR UPDATE
  USING (partner_id = auth.uid() AND status = 'pending');

-- Dashboard can read and operator-confirm all
CREATE POLICY "dashboard_manage_certifications"
  ON partner_certifications FOR ALL
  USING (auth.jwt() ->> 'role' IN ('founder_admin','admin','admin_operator','ops_manager'));
