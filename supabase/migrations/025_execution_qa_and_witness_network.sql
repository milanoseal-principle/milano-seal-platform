-- 025_execution_qa_and_witness_network.sql
-- Execution QA desk and witness/backup network

CREATE TABLE IF NOT EXISTS execution_qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  execution_qa_status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (execution_qa_status IN ('NOT_STARTED','IN_REVIEW','PASSED','REVIEW_REQUIRED','BLOCKED')),
  scanback_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (scanback_status IN ('NOT_REQUIRED','PENDING','UPLOADED','REVIEWED','FAILED','PASSED')),
  witness_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (witness_status IN ('NOT_REQUIRED','NEEDED','SCHEDULED','CONFIRMED','FAILED','COMPLETE')),
  checklist_type TEXT NOT NULL DEFAULT 'GENERAL_NOTARY_QA' CHECK (checklist_type IN ('GENERAL_NOTARY_QA','RON_QA','APOSTILLE_PACKET_QA','COURIER_PACKET_QA','INTERNATIONAL_PRIVATE_CLIENT_QA')),
  missing_items TEXT[],
  blocking_items TEXT[],
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  passed_by UUID,
  passed_at TIMESTAMPTZ,
  blocked_by UUID,
  blocked_at TIMESTAMPTZ,
  block_reason TEXT,
  operator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE execution_qa_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_qa_authenticated" ON execution_qa_reviews
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS execution_qa_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_review_id UUID NOT NULL REFERENCES execution_qa_reviews(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  checklist_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','failed','na')),
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE execution_qa_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_checklist_authenticated" ON execution_qa_checklist_items
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS execution_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  county TEXT,
  city TEXT,
  state TEXT DEFAULT 'FL',
  service_radius_miles INTEGER DEFAULT 25,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('WITNESS','BACKUP_NOTARY','MOBILE_NOTARY','RON_NOTARY','APOSTILLE_RUNNER','TRANSLATOR','COURIER_SUPPORT','DOCUMENT_PREP_SUPPORT')),
  credential_status TEXT DEFAULT 'PENDING' CHECK (credential_status IN ('PENDING','VERIFIED','EXPIRED','INACTIVE')),
  availability_status TEXT DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE','UNAVAILABLE','ON_CALL','INACTIVE')),
  last_used_at TIMESTAMPTZ,
  reliability_rating INTEGER CHECK (reliability_rating BETWEEN 1 AND 5),
  notes_operator_only TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE execution_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_partners_authenticated" ON execution_partners
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS execution_partner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES execution_partners(id) ON DELETE CASCADE,
  deal_id UUID,
  event_type TEXT NOT NULL,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE execution_partner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_events_authenticated" ON execution_partner_events
  FOR ALL USING (auth.uid() IS NOT NULL);
