-- THE MILANO SEAL™ — ITALY TEST MATTER (007)
-- Fake matter for end-to-end webhook + pipeline testing.
-- Covers: Wise payment webhook → BlueNotary RON webhook → Shippo tracking webhook → release.
-- Safe to run repeatedly (ON CONFLICT / DELETE-then-INSERT for events).
-- Email domain: test.milanoseal.local — never a real client address.
-- Run AFTER scripts 001–006 and migrations 015–018 in Supabase.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- CONSTANTS (used throughout this script)
--   Matter UUID  : f6000000-0000-0000-0000-000000000099
--   wise_reference: MS-ITALY-TEST-001   ← Wise webhook match key
--   notarization_id: BN-ITALY-TEST-001  ← BlueNotary webhook match key
--   tracking_number : MS-IT-DHL-000099  ← Shippo webhook match key
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. DEAL ──────────────────────────────────────────────────────────────────
-- Starts at awaiting_payment so the full state machine can be walked.

INSERT INTO deals (
  id,
  client_name,
  email,
  phone,
  country,
  document_type,
  destination_country,
  service_type,
  execution_lane,
  amount,
  total_price,
  amount_due,
  currency,
  status,
  payment_status,
  is_paid_and_released,
  requires_apostille,
  wise_reference,
  wise_payment_url,
  tracking_number,
  carrier,
  delivery_status,
  ship_to,
  notes,
  created_at,
  updated_at
) VALUES (
  'f6000000-0000-0000-0000-000000000099',
  'Test Client — Italy POA',
  'test+italy@test.milanoseal.local',
  '+1-305-000-0099',
  'florida',
  'Power of Attorney',
  'Italy',
  'RON + Apostille',
  'priority',
  975,
  975,
  975,
  'USD',
  'awaiting_payment',
  'pending',
  FALSE,
  TRUE,
  'MS-ITALY-TEST-001',
  'https://wise.com/pay/business/themilanoseal?reference=MS-ITALY-TEST-001&amount=975&currency=USD',
  'MS-IT-DHL-000099',
  'DHL Express',
  'not_shipped',
  '{"name": "Studio Legale Test", "street1": "Via Roma 1", "city": "Milan", "zip": "20121", "country": "IT"}'::jsonb,
  'SEED-007: Italy Power of Attorney — RON + Apostille. Webhook test matter. wise_reference=MS-ITALY-TEST-001 / notarization_id=BN-ITALY-TEST-001 / tracking_number=MS-IT-DHL-000099.',
  NOW() - INTERVAL '1 day',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status              = EXCLUDED.status,
  payment_status      = EXCLUDED.payment_status,
  is_paid_and_released = FALSE,
  wise_reference      = 'MS-ITALY-TEST-001',
  wise_payment_url    = 'https://wise.com/pay/business/themilanoseal?reference=MS-ITALY-TEST-001&amount=975&currency=USD',
  amount_due          = 975,
  currency            = 'USD',
  tracking_number     = 'MS-IT-DHL-000099',
  delivery_status     = 'not_shipped',
  updated_at          = NOW();

-- ── 2. RON SESSION ────────────────────────────────────────────────────────────
-- Required for BlueNotary webhook to match via notarization_id.
-- Starts DRAFT / payment gate LOCKED (mirrors real pre-payment state).

INSERT INTO ron_sessions (
  matter_id,
  notarization_id,
  bn_session_id,
  signing_type,
  session_type,
  blue_notary_status,
  milano_ron_status,
  payment_gate_status,
  session_url_status,
  final_documents_status,
  created_at,
  updated_at
) VALUES (
  'f6000000-0000-0000-0000-000000000099',
  'BN-ITALY-TEST-001',
  'BN-SID-ITALY-001',
  'ron',
  'notarization',
  'DRAFT',
  'RON_DRAFT',
  'LOCKED',
  'NOT_RELEASED',
  'NOT_AVAILABLE',
  NOW() - INTERVAL '23 hours',
  NOW()
) ON CONFLICT (notarization_id) DO UPDATE SET
  milano_ron_status    = 'RON_DRAFT',
  blue_notary_status   = 'DRAFT',
  payment_gate_status  = 'LOCKED',
  session_url_status   = 'NOT_RELEASED',
  updated_at           = NOW();

-- ── 3. RON SIGNER ─────────────────────────────────────────────────────────────

INSERT INTO ron_signers (
  ron_session_id,
  matter_id,
  signer_index,
  first_name,
  last_name,
  email,
  phone,
  state,
  authentication_type,
  signing_url_released,
  identity_status,
  kba_status
)
SELECT
  rs.id,
  rs.matter_id,
  1,
  'Test',
  'Client',
  'test+italy@test.milanoseal.local',
  '+1-305-000-0099',
  'florida',
  'kba',
  FALSE,
  'NOT_STARTED',
  'NOT_STARTED'
FROM ron_sessions rs
WHERE rs.notarization_id = 'BN-ITALY-TEST-001'
ON CONFLICT DO NOTHING;

-- ── 4. SHIPPO SHIPMENT ────────────────────────────────────────────────────────
-- Required for Shippo tracking webhook to match via tracking_number.
-- Starts UNKNOWN courier_status (not yet shipped).

INSERT INTO shippo_shipments (
  matter_id,
  carrier,
  service_level,
  tracking_number,
  shippo_status,
  courier_status,
  address_from,
  address_to,
  parcel,
  customs_required,
  created_at,
  updated_at
) VALUES (
  'f6000000-0000-0000-0000-000000000099',
  'dhl_express',
  'dhl_express_worldwide',
  'MS-IT-DHL-000099',
  'UNKNOWN',
  'UNKNOWN',
  '{"name": "The Milano Seal", "street1": "100 SE 2nd St", "city": "Miami", "state": "FL", "zip": "33131", "country": "US"}'::jsonb,
  '{"name": "Studio Legale Test", "street1": "Via Roma 1", "city": "Milan", "zip": "20121", "country": "IT"}'::jsonb,
  '{"length": "12", "width": "9", "height": "0.5", "distance_unit": "in", "weight": "0.3", "mass_unit": "lb"}'::jsonb,
  TRUE,
  NOW() - INTERVAL '22 hours',
  NOW()
) ON CONFLICT DO NOTHING;

-- ── 5. MATTER EVENTS (portal timeline) ───────────────────────────────────────
-- Delete-then-insert ensures idempotency.

DELETE FROM matter_events
WHERE matter_id = 'f6000000-0000-0000-0000-000000000099';

INSERT INTO matter_events (matter_id, event_type, notes, actor, client_visible, created_at) VALUES
  ('f6000000-0000-0000-0000-000000000099',
   'matter_received',
   'Your matter has been received and is being structured for execution.',
   'system', TRUE, NOW() - INTERVAL '1 day'),
  ('f6000000-0000-0000-0000-000000000099',
   'invoice_issued',
   'Your execution proposal is ready. Please review and submit payment to proceed.',
   'coordinator', TRUE, NOW() - INTERVAL '23 hours');

-- ── 6. CUSTODY LEDGER (genesis) ───────────────────────────────────────────────

DELETE FROM custody_ledger
WHERE deal_id = 'f6000000-0000-0000-0000-000000000099';

INSERT INTO custody_ledger (
  deal_id, event, actor_type, actor_id, location, status, notes, prev_hash, hash, created_at
) VALUES (
  'f6000000-0000-0000-0000-000000000099',
  'DOC_CREATED',
  'system',
  'seed-007',
  'Milano Seal HQ — Miami, FL',
  'received',
  'Italy Power of Attorney matter created. Awaiting payment gate.',
  'GENESIS',
  md5('{"deal":"f6000000-italy","event":"DOC_CREATED","ts":"seed-007"}'),
  NOW() - INTERVAL '1 day'
);

-- ── 7. STATUS CHECK ───────────────────────────────────────────────────────────

SELECT
  'Italy test matter ready.' AS status,
  d.id AS matter_id,
  d.status,
  d.payment_status,
  d.wise_reference,
  d.tracking_number,
  rs.notarization_id,
  rs.milano_ron_status,
  rs.payment_gate_status,
  ss.courier_status,
  (SELECT COUNT(*) FROM matter_events WHERE matter_id = d.id) AS events,
  (SELECT COUNT(*) FROM custody_ledger WHERE deal_id = d.id) AS custody_entries
FROM deals d
LEFT JOIN ron_sessions rs ON rs.matter_id = d.id
LEFT JOIN shippo_shipments ss ON ss.matter_id = d.id
WHERE d.id = 'f6000000-0000-0000-0000-000000000099';
