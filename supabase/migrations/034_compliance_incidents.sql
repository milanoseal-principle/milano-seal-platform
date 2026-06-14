-- Compliance Incident Response System
-- Tracks errors, E&O events, and remediation workflows

CREATE TABLE IF NOT EXISTS compliance_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  incident_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'REMEDIATION_IN_PROGRESS', 'PENDING_CLIENT', 'RESOLVED', 'CLOSED', 'FROZEN')),
  title text NOT NULL,
  description text,
  affected_identifiers text[],
  client_name text,
  matter_reference text,
  destination_country text,
  discovered_by text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  assigned_to text,
  freeze_triggered boolean NOT NULL DEFAULT false,
  freeze_triggered_at timestamptz,
  freeze_reason text,
  make_it_right_triggered boolean NOT NULL DEFAULT false,
  make_it_right_type text,
  make_it_right_note text,
  courtesy_adjustment_amount numeric DEFAULT 0,
  courtesy_code_issued text,
  client_notified boolean NOT NULL DEFAULT false,
  client_notified_at timestamptz,
  resolution_note text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit log for all incident state changes
CREATE TABLE IF NOT EXISTS incident_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES compliance_incidents(id) ON DELETE CASCADE,
  actor text NOT NULL,
  action text NOT NULL,
  previous_status text,
  new_status text,
  note text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Critical identifier snapshots — immutable record of identifiers at time of capture
CREATE TABLE IF NOT EXISTS critical_identifier_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  field_type text NOT NULL,
  field_value text NOT NULL,
  source_document text,
  captured_by text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  verified boolean NOT NULL DEFAULT false,
  verified_by text,
  verified_at timestamptz,
  locked boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  incident_id uuid REFERENCES compliance_incidents(id) ON DELETE SET NULL
);

-- RLS: operator-only access
ALTER TABLE compliance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_identifier_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_compliance_incidents" ON compliance_incidents
  FOR ALL TO authenticated USING (true);

CREATE POLICY "operator_incident_audit_log" ON incident_audit_log
  FOR ALL TO authenticated USING (true);

CREATE POLICY "operator_identifier_snapshots" ON critical_identifier_snapshots
  FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_deal_id ON compliance_incidents(deal_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON compliance_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON compliance_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON compliance_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_audit_incident_id ON incident_audit_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_identifier_snapshots_deal_id ON critical_identifier_snapshots(deal_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_compliance_incidents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER compliance_incidents_updated_at
  BEFORE UPDATE ON compliance_incidents
  FOR EACH ROW EXECUTE FUNCTION update_compliance_incidents_updated_at();
