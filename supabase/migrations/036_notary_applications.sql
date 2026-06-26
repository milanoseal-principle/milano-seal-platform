-- Notary / RON Provider Onboarding
-- Public application gate → operator review → activation

CREATE TABLE IF NOT EXISTS notary_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  state_of_commission text NOT NULL,
  commission_number text,
  commission_expiry date,
  is_ron_certified boolean NOT NULL DEFAULT false,
  ron_platform text,
  is_mobile_notary boolean NOT NULL DEFAULT false,
  service_counties text[],
  years_experience integer DEFAULT 0,
  specialties text[],
  has_eo_insurance boolean NOT NULL DEFAULT false,
  eo_carrier text,
  eo_policy_number text,
  eo_expiry date,
  linkedin_url text,
  notes text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  partner_type text CHECK (partner_type IN ('NOTARY_PARTNER', 'RON_NOTARY', 'MOBILE_NOTARY', 'HYBRID')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Active notary credentials for approved partners
CREATE TABLE IF NOT EXISTS notary_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES notary_applications(id) ON DELETE SET NULL,
  partner_id uuid,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  state_of_commission text NOT NULL,
  commission_number text,
  commission_expiry date,
  is_ron_certified boolean NOT NULL DEFAULT false,
  ron_platform text,
  is_mobile_notary boolean NOT NULL DEFAULT false,
  service_counties text[],
  partner_type text NOT NULL CHECK (partner_type IN ('NOTARY_PARTNER', 'RON_NOTARY', 'MOBILE_NOTARY', 'HYBRID')),
  has_eo_insurance boolean NOT NULL DEFAULT false,
  eo_carrier text,
  eo_policy_number text,
  eo_expiry date,
  active boolean NOT NULL DEFAULT true,
  confidence_score integer DEFAULT 100 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  matters_completed integer NOT NULL DEFAULT 0,
  last_assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Matter-notary assignments
CREATE TABLE IF NOT EXISTS notary_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  notary_credential_id uuid REFERENCES notary_credentials(id) ON DELETE SET NULL,
  assignment_type text NOT NULL CHECK (assignment_type IN ('RON', 'MOBILE', 'WITNESS')),
  status text NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'CONFIRMED', 'IN_SESSION', 'COMPLETED', 'CANCELLED', 'REASSIGNED')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  session_platform text,
  session_notes text,
  assigned_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Public applications: anyone can insert (no auth required)
ALTER TABLE notary_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_notary_apply" ON notary_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "operator_notary_applications_read" ON notary_applications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "operator_notary_applications_update" ON notary_applications
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "operator_notary_credentials" ON notary_credentials
  FOR ALL TO authenticated USING (true);

CREATE POLICY "operator_notary_assignments" ON notary_assignments
  FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notary_apps_status ON notary_applications(status);
CREATE INDEX IF NOT EXISTS idx_notary_apps_email ON notary_applications(email);
CREATE INDEX IF NOT EXISTS idx_notary_creds_active ON notary_credentials(active);
CREATE INDEX IF NOT EXISTS idx_notary_creds_type ON notary_credentials(partner_type);
CREATE INDEX IF NOT EXISTS idx_notary_assignments_deal_id ON notary_assignments(deal_id);
CREATE INDEX IF NOT EXISTS idx_notary_assignments_status ON notary_assignments(status);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_notary_applications_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER notary_applications_updated_at
  BEFORE UPDATE ON notary_applications
  FOR EACH ROW EXECUTE FUNCTION update_notary_applications_updated_at();

CREATE TRIGGER notary_credentials_updated_at
  BEFORE UPDATE ON notary_credentials
  FOR EACH ROW EXECUTE FUNCTION update_notary_applications_updated_at();

CREATE TRIGGER notary_assignments_updated_at
  BEFORE UPDATE ON notary_assignments
  FOR EACH ROW EXECUTE FUNCTION update_notary_applications_updated_at();
