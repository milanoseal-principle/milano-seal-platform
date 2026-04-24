-- THE MILANO SEAL™ — TRUST ENGINE DATABASE SCHEMA
-- Run in Supabase SQL Editor AFTER scripts 001 and 002
-- Adds: clients, messages, pricing_logs, compliance_rules tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Compliance rules table (for DB-backed compliance lookups)
CREATE TABLE IF NOT EXISTS compliance_rules (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  jurisdiction        TEXT UNIQUE NOT NULL,
  jurisdiction_type   TEXT NOT NULL CHECK (jurisdiction_type IN ('state','country')),
  ron_allowed         BOOLEAN DEFAULT FALSE,
  apostille_required  BOOLEAN DEFAULT FALSE,
  witnesses_required  BOOLEAN DEFAULT FALSE,
  witness_count       INTEGER DEFAULT 0,
  hague_member        BOOLEAN DEFAULT FALSE,
  restrictions        TEXT[],
  notes               TEXT,
  execution_path      TEXT[],
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Seed compliance rules
INSERT INTO compliance_rules (jurisdiction,jurisdiction_type,ron_allowed,apostille_required,
  witnesses_required,witness_count,hague_member,restrictions,notes,execution_path) VALUES

('florida','state',TRUE,FALSE,FALSE,0,FALSE,
 ARRAY[]::TEXT[],
 'Florida RON fully authorized. No witnesses required for standard documents.',
 ARRAY['RON via approved platform','Electronic seal applied','Certificate issued']),

('colorado','state',FALSE,FALSE,TRUE,2,FALSE,
 ARRAY['RON not broadly available','Two witnesses for deeds'],
 'Colorado has limited RON. Most matters require in-person or mobile notary.',
 ARRAY['In-person or mobile notary','Two witnesses for deeds','Traditional certificate']),

('italy','country',FALSE,TRUE,TRUE,2,TRUE,
 ARRAY['RON not accepted for apostille chain','Traditional notarization required','Translation may be required'],
 'Hague Convention member. All US docs for Italy require apostille. Two witnesses for property/estate.',
 ARRAY['Traditional notarization','Apostille via FL Dept of State','Certified translation if required','International delivery']),

('spain','country',FALSE,TRUE,FALSE,0,TRUE,
 ARRAY['Spanish translation required for official submissions'],
 'Hague Convention member. Apostille required. Spanish translation typically needed.',
 ARRAY['Notarization','Apostille','Certified translation','International delivery']),

('portugal','country',FALSE,TRUE,FALSE,0,TRUE,
 ARRAY['Portuguese translation required','High D8/NHR residency volume'],
 'Hague Convention member. D8 visa and NHR residency high demand.',
 ARRAY['Notarization','Apostille','Translation if required','Delivery']),

('france','country',FALSE,TRUE,FALSE,0,TRUE,
 ARRAY['French translation typically required'],
 'Hague Convention member. French translation typically required.',
 ARRAY['Notarization','Apostille via FL Dept of State','French translation','Delivery']),

('germany','country',FALSE,TRUE,FALSE,0,TRUE,
 ARRAY['German translation required','Ancestry visa demand'],
 'Hague Convention member. German translation required.',
 ARRAY['Notarization','Apostille via FL Dept of State','German translation','Delivery']),

('brazil','country',FALSE,TRUE,FALSE,0,TRUE,
 ARRAY['Portuguese translation required','Hague member since 2016'],
 'Brazil joined Hague Convention 2016. Portuguese translation required.',
 ARRAY['Notarization','Apostille','Portuguese translation','Delivery']),

('mexico','country',FALSE,FALSE,FALSE,0,FALSE,
 ARRAY['NOT Hague Convention member','Full legalization chain required'],
 'Mexico requires full consular legalization chain, not apostille.',
 ARRAY['Notarization','Secretary of State authentication','Consular legalization','Delivery']),

('greece','country',FALSE,TRUE,FALSE,0,TRUE,
 ARRAY['RON not accepted','Apostille mandatory'],
 'Hague Convention member. All US-origin documents require apostille.',
 ARRAY['Notarization','Apostille via FL Dept of State','Translation if required','Delivery']),

('united states','country',TRUE,FALSE,FALSE,0,FALSE,
 ARRAY[]::TEXT[],
 'Domestic. No apostille required. RON accepted per state authorization.',
 ARRAY['RON or mobile notarization','Certificate issued','Digital or physical delivery'])

ON CONFLICT (jurisdiction) DO UPDATE SET
  ron_allowed=EXCLUDED.ron_allowed,
  apostille_required=EXCLUDED.apostille_required,
  witnesses_required=EXCLUDED.witnesses_required,
  hague_member=EXCLUDED.hague_member,
  notes=EXCLUDED.notes,
  execution_path=EXCLUDED.execution_path,
  updated_at=NOW();

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id     UUID REFERENCES deals(id) ON DELETE CASCADE,
  direction   TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  channel     TEXT DEFAULT 'whatsapp',
  content     TEXT NOT NULL,
  status      TEXT DEFAULT 'sent',
  twilio_sid  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_deal ON messages(deal_id);

-- RLS
ALTER TABLE IF EXISTS compliance_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_compliance" ON compliance_rules;
DROP POLICY IF EXISTS "pub_compliance" ON compliance_rules;
CREATE POLICY "svc_compliance" ON compliance_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "pub_compliance" ON compliance_rules FOR SELECT USING (TRUE);

SELECT 'Trust Engine schema installed.' AS status;
