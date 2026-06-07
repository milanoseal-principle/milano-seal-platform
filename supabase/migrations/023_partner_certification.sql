-- 023_partner_certification.sql
-- Partner Tool Belt Certification — 7-step gated onboarding

CREATE TABLE IF NOT EXISTS partner_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_1_identity BOOLEAN DEFAULT false,
  step_2_service_scope BOOLEAN DEFAULT false,
  step_3_document_handling BOOLEAN DEFAULT false,
  step_4_client_communication BOOLEAN DEFAULT false,
  step_5_referral_routing BOOLEAN DEFAULT false,
  step_6_security_attestation BOOLEAN DEFAULT false,
  step_7_compliance_acknowledgement BOOLEAN DEFAULT false,
  routing_status TEXT NOT NULL DEFAULT 'ROUTING_LOCKED' CHECK (routing_status IN ('ROUTING_LOCKED','ROUTING_ELIGIBLE','ACTIVE_PARTNER')),
  operator_approved_at TIMESTAMPTZ,
  operator_approved_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id)
);

ALTER TABLE partner_certifications ENABLE ROW LEVEL SECURITY;

-- Partner can only read their own certification
CREATE POLICY "partner_certification_own_read" ON partner_certifications
  FOR SELECT
  USING (partner_id = auth.uid());

-- Partner can update only their own step completions (not routing_status — that requires operator)
CREATE POLICY "partner_certification_own_update_steps" ON partner_certifications
  FOR UPDATE
  USING (partner_id = auth.uid())
  WITH CHECK (
    partner_id = auth.uid()
    AND routing_status = 'ROUTING_LOCKED'
  );

-- Operators control routing_status promotion
CREATE POLICY "partner_certification_operator_all" ON partner_certifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','operator','superadmin','founder_admin','admin_operator','ops_manager')
    )
  );
