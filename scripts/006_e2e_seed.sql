-- THE MILANO SEAL™ — FINAL-E2E-SEED-01
-- End-to-end test seed data for portal, alliance, and timeline testing.
-- Schema tables (files, matter_events) and deals column patches are in script 005.
-- This script is safe to run repeatedly — deals/operator use ON CONFLICT DO UPDATE;
-- matter_events and custody_ledger are deleted and re-inserted for idempotency.
-- Run AFTER scripts 001–005 in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- 1. REMAINING SCHEMA TABLES not needed by the script 005 views
-- ────────────────────────────────────────────────────────────────────────────

-- Custody ledger (chain-of-custody for documents)
CREATE TABLE IF NOT EXISTS custody_ledger (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id      UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  event        TEXT NOT NULL,
  actor_type   TEXT NOT NULL DEFAULT 'system',
  actor_id     TEXT,
  location     TEXT,
  method       TEXT,
  status       TEXT,
  notes        TEXT,
  metadata     JSONB DEFAULT '{}',
  prev_hash    TEXT,
  hash         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custody_deal ON custody_ledger(deal_id);
CREATE INDEX IF NOT EXISTS idx_custody_created ON custody_ledger(deal_id, created_at ASC);
ALTER TABLE custody_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_custody" ON custody_ledger;
CREATE POLICY "svc_custody" ON custody_ledger FOR ALL TO service_role USING (true);

-- Audit logs (admin override + access audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor      TEXT DEFAULT 'system',
  event      TEXT NOT NULL,
  resource   TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_audit" ON audit_logs;
CREATE POLICY "svc_audit" ON audit_logs FOR ALL TO service_role USING (true);

-- Portal OTPs (email-based portal auth)
CREATE TABLE IF NOT EXISTS portal_otps (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT NOT NULL,
  otp        TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_otps_email ON portal_otps(email);
ALTER TABLE portal_otps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_portal_otps" ON portal_otps;
CREATE POLICY "svc_portal_otps" ON portal_otps FOR ALL TO service_role USING (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. FIX MEXICO (compliance correction — also done in 004, idempotent)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE compliance_rules SET
  hague_member        = TRUE,
  apostille_required  = TRUE,
  restrictions        = ARRAY[
    'Apostille required for U.S. public documents used in Mexico',
    'Spanish translation may be required depending on receiving authority',
    'Manual review required for real estate, court, corporate, or consular-sensitive filings'
  ],
  notes               = 'Mexico is a Hague Apostille destination for U.S.-origin public documents. Apostille routing applies; translation or receiving-authority requirements may still apply.',
  execution_path      = ARRAY[
    'Notarization or certified public document issuance',
    'Apostille by issuing state or competent authority',
    'Certified Spanish translation if required',
    'Courier or digital delivery to recipient'
  ],
  updated_at = NOW()
WHERE jurisdiction = 'mexico';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TEST DEALS (5 representative matters across the state machine)
-- email domain: test.milanoseal.local — never a real client address
-- ────────────────────────────────────────────────────────────────────────────

-- Scenario A: New intake, awaiting payment — portal shows payment gate
INSERT INTO deals (
  id, client_name, email, phone, country, document_type, destination_country,
  service_type, execution_lane, amount, total_price,
  status, payment_status,
  notes, created_at, updated_at
) VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Test Client — Awaiting Payment',
  'test+awaiting@test.milanoseal.local',
  '+1-305-000-0001',
  'florida', 'Power of Attorney', 'Italy',
  'Standard Execution', 'signature', 750, 750,
  'awaiting_payment', 'pending',
  'SEED: Power of Attorney for Italy, awaiting payment.',
  NOW() - INTERVAL '3 days', NOW()
) ON CONFLICT (id) DO UPDATE SET
  status         = 'awaiting_payment',
  payment_status = 'pending',
  updated_at     = NOW();

-- Scenario B: Payment confirmed, scheduled — portal shows scheduling unlocked
INSERT INTO deals (
  id, client_name, email, phone, country, document_type, destination_country,
  service_type, execution_lane, amount, total_price,
  status, payment_status, is_paid_and_released,
  notes, created_at, updated_at
) VALUES (
  'b2000000-0000-0000-0000-000000000002',
  'Test Client — Scheduled',
  'test+scheduled@test.milanoseal.local',
  '+1-305-000-0002',
  'florida', 'Affidavit of Support', 'Spain',
  'Priority Execution', 'priority', 975, 975,
  'scheduled', 'paid', FALSE,
  'SEED: Affidavit of Support for Spain, payment confirmed and scheduled.',
  NOW() - INTERVAL '6 days', NOW()
) ON CONFLICT (id) DO UPDATE SET
  status         = 'scheduled',
  payment_status = 'paid',
  updated_at     = NOW();

-- Scenario C: In execution / apostille processing
INSERT INTO deals (
  id, client_name, email, phone, country, document_type, destination_country,
  service_type, execution_lane, amount, total_price,
  status, payment_status, is_paid_and_released,
  notes, created_at, updated_at
) VALUES (
  'c3000000-0000-0000-0000-000000000003',
  'Test Client — Apostille',
  'test+apostille@test.milanoseal.local',
  '+1-305-000-0003',
  'florida', 'Birth Certificate Authentication', 'Germany',
  'Standard Execution', 'signature', 750, 1000,
  'apostille_processing', 'paid', FALSE,
  'SEED: Birth certificate for Germany, apostille in progress.',
  NOW() - INTERVAL '10 days', NOW()
) ON CONFLICT (id) DO UPDATE SET
  status         = 'apostille_processing',
  payment_status = 'paid',
  updated_at     = NOW();

-- Scenario D: Shipped with tracking
INSERT INTO deals (
  id, client_name, email, phone, country, document_type, destination_country,
  service_type, execution_lane, amount, total_price,
  status, payment_status, is_paid_and_released,
  tracking_number, carrier, delivery_status,
  notes, created_at, updated_at
) VALUES (
  'd4000000-0000-0000-0000-000000000004',
  'Test Client — Shipped',
  'test+shipped@test.milanoseal.local',
  '+1-305-000-0004',
  'florida', 'Corporate Resolution', 'Portugal',
  'Priority Execution', 'priority', 975, 1225,
  'shipped', 'paid', FALSE,
  'MS-TEST-TRACK-001', 'DHL Express', 'in_transit',
  'SEED: Corporate resolution for Portugal, shipped via DHL.',
  NOW() - INTERVAL '14 days', NOW()
) ON CONFLICT (id) DO UPDATE SET
  status          = 'shipped',
  tracking_number = 'MS-TEST-TRACK-001',
  updated_at      = NOW();

-- Scenario E: Completed + paid and released (full happy path)
INSERT INTO deals (
  id, client_name, email, phone, country, document_type, destination_country,
  service_type, execution_lane, amount, total_price,
  status, payment_status, is_paid_and_released,
  tracking_number, carrier, delivery_status, delivery_timestamp,
  notes, created_at, updated_at
) VALUES (
  'e5000000-0000-0000-0000-000000000005',
  'Test Client — Completed',
  'test+completed@test.milanoseal.local',
  '+1-305-000-0005',
  'florida', 'Power of Attorney', 'France',
  'Executive In-Person', 'executive', 1850, 2100,
  'completed', 'paid', TRUE,
  'MS-TEST-TRACK-002', 'FedEx International', 'delivered',
  NOW() - INTERVAL '2 days',
  'SEED: Executive Power of Attorney for France, completed and released.',
  NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO UPDATE SET
  status               = 'completed',
  is_paid_and_released = TRUE,
  updated_at           = NOW() - INTERVAL '2 days';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. MATTER EVENTS (portal timeline)
-- Delete-then-insert ensures idempotency across repeated seed runs.
-- ────────────────────────────────────────────────────────────────────────────
DELETE FROM matter_events WHERE matter_id IN (
  'a1000000-0000-0000-0000-000000000001',
  'b2000000-0000-0000-0000-000000000002',
  'c3000000-0000-0000-0000-000000000003',
  'd4000000-0000-0000-0000-000000000004',
  'e5000000-0000-0000-0000-000000000005'
);

-- Scenario A events
INSERT INTO matter_events (matter_id, event_type, notes, actor, client_visible, created_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'matter_received',
   'Your matter has been received and is being structured for review.', 'system', TRUE, NOW() - INTERVAL '3 days'),
  ('a1000000-0000-0000-0000-000000000001', 'invoice_issued',
   'Your execution proposal is ready. Please review and submit payment.', 'coordinator', TRUE, NOW() - INTERVAL '2 days 12 hours');

-- Scenario B events
INSERT INTO matter_events (matter_id, event_type, notes, actor, client_visible, created_at) VALUES
  ('b2000000-0000-0000-0000-000000000002', 'matter_received',
   'Your matter has been received and is being structured for review.', 'system', TRUE, NOW() - INTERVAL '6 days'),
  ('b2000000-0000-0000-0000-000000000002', 'invoice_issued',
   'Your execution proposal is ready.', 'coordinator', TRUE, NOW() - INTERVAL '5 days'),
  ('b2000000-0000-0000-0000-000000000002', 'payment_confirmed',
   'Payment has been confirmed. Your matter has been scheduled for execution.', 'system', TRUE, NOW() - INTERVAL '4 days');

-- Scenario C events
INSERT INTO matter_events (matter_id, event_type, notes, actor, client_visible, created_at) VALUES
  ('c3000000-0000-0000-0000-000000000003', 'matter_received',
   'Your matter has been received and is being structured for review.', 'system', TRUE, NOW() - INTERVAL '10 days'),
  ('c3000000-0000-0000-0000-000000000003', 'payment_confirmed',
   'Payment has been confirmed. Scheduling is now unlocked.', 'system', TRUE, NOW() - INTERVAL '9 days'),
  ('c3000000-0000-0000-0000-000000000003', 'execution_complete',
   'Your document has been notarized and is moving into apostille processing.', 'coordinator', TRUE, NOW() - INTERVAL '5 days'),
  ('c3000000-0000-0000-0000-000000000003', 'apostille_submitted',
   'Your document has been submitted to the Florida Department of State for apostille.', 'coordinator', TRUE, NOW() - INTERVAL '2 days');

-- Scenario D events
INSERT INTO matter_events (matter_id, event_type, notes, actor, client_visible, created_at) VALUES
  ('d4000000-0000-0000-0000-000000000004', 'matter_received',
   'Your matter has been received.', 'system', TRUE, NOW() - INTERVAL '14 days'),
  ('d4000000-0000-0000-0000-000000000004', 'payment_confirmed',
   'Payment confirmed. Scheduling unlocked.', 'system', TRUE, NOW() - INTERVAL '13 days'),
  ('d4000000-0000-0000-0000-000000000004', 'apostille_complete',
   'Apostille received. Document packaged for courier.', 'coordinator', TRUE, NOW() - INTERVAL '4 days'),
  ('d4000000-0000-0000-0000-000000000004', 'shipment_released',
   'Your document has been released for courier delivery via DHL Express. Tracking: MS-TEST-TRACK-001', 'system', TRUE, NOW() - INTERVAL '2 days');

-- Scenario E events
INSERT INTO matter_events (matter_id, event_type, notes, actor, client_visible, created_at) VALUES
  ('e5000000-0000-0000-0000-000000000005', 'matter_received',
   'Your matter has been received.', 'system', TRUE, NOW() - INTERVAL '20 days'),
  ('e5000000-0000-0000-0000-000000000005', 'payment_confirmed',
   'Payment confirmed. Scheduling unlocked.', 'system', TRUE, NOW() - INTERVAL '19 days'),
  ('e5000000-0000-0000-0000-000000000005', 'execution_complete',
   'Executive notarization session complete. Document sealed.', 'coordinator', TRUE, NOW() - INTERVAL '15 days'),
  ('e5000000-0000-0000-0000-000000000005', 'apostille_complete',
   'Apostille received from Florida Department of State.', 'coordinator', TRUE, NOW() - INTERVAL '10 days'),
  ('e5000000-0000-0000-0000-000000000005', 'shipment_released',
   'Document released for international courier delivery via FedEx International.', 'system', TRUE, NOW() - INTERVAL '5 days'),
  ('e5000000-0000-0000-0000-000000000005', 'matter_closed',
   'Your matter has been completed. Documents delivered and all obligations fulfilled.', 'system', TRUE, NOW() - INTERVAL '2 days');

-- ────────────────────────────────────────────────────────────────────────────
-- 5. CUSTODY LEDGER (genesis entries — delete-then-insert for idempotency)
-- Uses md5() which is built-in; no pgcrypto extension required.
-- ────────────────────────────────────────────────────────────────────────────
DELETE FROM custody_ledger WHERE deal_id IN (
  'a1000000-0000-0000-0000-000000000001',
  'e5000000-0000-0000-0000-000000000005'
);

INSERT INTO custody_ledger (deal_id, event, actor_type, actor_id, location, status, notes, prev_hash, hash, created_at) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'DOC_CREATED', 'system', 'seed', 'Milano Seal HQ', 'received',
   'Matter created via intake', 'GENESIS',
   md5('{"deal":"a1000000","event":"DOC_CREATED","ts":"seed"}'),
   NOW() - INTERVAL '3 days'),
  ('e5000000-0000-0000-0000-000000000005',
   'DOC_CREATED', 'system', 'seed', 'Milano Seal HQ', 'received',
   'Matter created via intake', 'GENESIS',
   md5('{"deal":"e5000000","event":"DOC_CREATED","ts":"seed"}'),
   NOW() - INTERVAL '20 days'),
  ('e5000000-0000-0000-0000-000000000005',
   'DOC_NOTARIZED', 'notary', 'Nicholas Milano', 'Miami, FL', 'complete',
   'Executive in-person session complete', 'GENESIS_2',
   md5('{"deal":"e5000000","event":"DOC_NOTARIZED","ts":"seed2"}'),
   NOW() - INTERVAL '15 days'),
  ('e5000000-0000-0000-0000-000000000005',
   'DOC_DELIVERED', 'courier', 'FedEx International', 'Paris, France', 'delivered',
   'Matter complete. Documents received by client.', 'GENESIS_3',
   md5('{"deal":"e5000000","event":"DOC_DELIVERED","ts":"seed3"}'),
   NOW() - INTERVAL '2 days');

-- ────────────────────────────────────────────────────────────────────────────
-- 6. TEST OPERATOR (for alliance dispatch testing)
-- Upserted by email — no hardcoded UUID.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO operator_profiles (
  full_name, email, phone, firm_name,
  onboarding_status, identity_verified, admin_approved,
  state, secondary_states,
  notary_commission_number, notary_commission_expires,
  created_at, updated_at
) VALUES (
  'Test Operator — Fully Eligible',
  'test+operator@test.milanoseal.local',
  '+1-305-000-0010',
  'Milano Seal Alliance Test Operator LLC',
  'approved', TRUE, TRUE,
  'florida', ARRAY['texas', 'new_york'],
  'FL-NTY-TEST-001',
  NOW() + INTERVAL '2 years',
  NOW() - INTERVAL '30 days', NOW()
) ON CONFLICT (email) DO UPDATE SET
  onboarding_status = 'approved',
  identity_verified = TRUE,
  admin_approved    = TRUE,
  updated_at        = NOW();

-- Compliance record for test operator
INSERT INTO operator_compliance_status (
  operator_id,
  compliance_ready, e_o_insurance_verified, background_check_passed,
  notary_commission_verified, nna_certified, state_license_verified,
  data_handling_agreement, brand_guidelines_accepted
)
SELECT
  id,
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
FROM operator_profiles WHERE email = 'test+operator@test.milanoseal.local'
ON CONFLICT (operator_id) DO UPDATE SET
  compliance_ready = TRUE,
  updated_at       = NOW();

-- Provision toolbelt for test operator
SELECT provision_operator_toolbelt(id)
FROM operator_profiles WHERE email = 'test+operator@test.milanoseal.local';

-- Mark all tools verified for the test operator
UPDATE operator_toolbelt_status SET
  status         = 'verified',
  completion_pct = 100,
  verified_at    = NOW() - INTERVAL '5 days',
  updated_at     = NOW()
WHERE operator_id = (
  SELECT id FROM operator_profiles WHERE email = 'test+operator@test.milanoseal.local'
);

-- Set eligibility for test operator
INSERT INTO operator_routing_eligibility (
  operator_id, eligible, toolbelt_score, blockers, last_evaluated_at, updated_at
)
SELECT
  id, TRUE, 100, ARRAY[]::TEXT[], NOW(), NOW()
FROM operator_profiles WHERE email = 'test+operator@test.milanoseal.local'
ON CONFLICT (operator_id) DO UPDATE SET
  eligible          = TRUE,
  toolbelt_score    = 100,
  blockers          = ARRAY[]::TEXT[],
  last_evaluated_at = NOW(),
  updated_at        = NOW();

-- Set availability for test operator
INSERT INTO operator_availability_log (operator_id, availability, set_by, reason)
SELECT id, 'AVAILABLE', 'seed', 'Seeded for testing'
FROM operator_profiles WHERE email = 'test+operator@test.milanoseal.local';

-- ────────────────────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET — documents (private, required for signed URL vault)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ────────────────────────────────────────────────────────────────────────────
-- STATUS
-- ────────────────────────────────────────────────────────────────────────────
SELECT
  'E2E seed complete.' AS status,
  (SELECT count(*) FROM deals WHERE email LIKE '%@test.milanoseal.local') AS test_deals,
  (SELECT count(*) FROM matter_events WHERE matter_id IN (
    SELECT id FROM deals WHERE email LIKE '%@test.milanoseal.local'
  )) AS test_events,
  (SELECT count(*) FROM operator_profiles WHERE email LIKE '%@test.milanoseal.local') AS test_operators,
  (SELECT public FROM storage.buckets WHERE id = 'documents') AS documents_bucket_public;
