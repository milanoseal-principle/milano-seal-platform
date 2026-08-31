-- 023_partner_certification.sql
-- Partner Tool Belt Certification — 7-step gated onboarding

CREATE TABLE IF NOT EXISTS partner_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Authenticated partner user UUID. The canonical migration chain does not
  -- define public.profiles, and policy semantics already bind this to auth.uid().
  partner_id UUID NOT NULL,
  step_1_identity BOOLEAN DEFAULT false,
  step_2_service_scope BOOLEAN DEFAULT false,
  step_3_document_handling BOOLEAN DEFAULT false,
  step_4_client_communication BOOLEAN DEFAULT false,
  step_5_referral_routing BOOLEAN DEFAULT false,
  step_6_security_attestation BOOLEAN DEFAULT false,
  step_7_compliance_acknowledgement BOOLEAN DEFAULT false,
  routing_status TEXT NOT NULL DEFAULT 'ROUTING_LOCKED' CHECK (routing_status IN ('ROUTING_LOCKED','ROUTING_ELIGIBLE','ACTIVE_PARTNER')),
  operator_approved_at TIMESTAMPTZ,
  operator_approved_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id)
);

ALTER TABLE partner_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_certification_own_read" ON partner_certifications;
CREATE POLICY "partner_certification_own_read" ON partner_certifications
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "partner_certification_own_update_steps" ON partner_certifications;
CREATE POLICY "partner_certification_own_update_steps" ON partner_certifications
  FOR UPDATE TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (
    partner_id = auth.uid()
    AND routing_status = 'ROUTING_LOCKED'
  );

DROP POLICY IF EXISTS "partner_certification_operator_all" ON partner_certifications;
CREATE POLICY "partner_certification_operator_all" ON partner_certifications
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager')
  );

DROP POLICY IF EXISTS "partner_certification_service_all" ON partner_certifications;
CREATE POLICY "partner_certification_service_all" ON partner_certifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
