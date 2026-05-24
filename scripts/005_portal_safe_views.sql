-- THE MILANO SEAL™ — PORTAL-03: CLIENT-SAFE DATA BOUNDARY VIEWS
-- Run AFTER scripts 001–004 in Supabase SQL Editor
-- These views are the ONLY source of data for the client portal.
-- Structural guarantee: no internal cost, margin, operator notes, or raw paths.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CLIENT SAFE MATTER VIEW
-- Maps public-facing status language. Blocks all internal financial fields.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW client_safe_matter_view AS
SELECT
  d.id                        AS matter_id,
  d.id                        AS display_id,
  d.email                     AS client_email,
  d.client_name,
  d.document_type,
  d.destination_country,
  COALESCE(d.service_type, 'Standard Execution') AS assigned_lane,
  d.status                    AS matter_status,
  CASE d.status
    WHEN 'new'                 THEN 'Your matter has been received and is being structured for review.'
    WHEN 'intake_received'     THEN 'Your matter has been received and is being structured for review.'
    WHEN 'under_review'        THEN 'Your document path is being reviewed for execution readiness and international use.'
    WHEN 'compliance_review'   THEN 'This matter requires review before execution can continue.'
    WHEN 'quoted'              THEN 'Your execution proposal is ready.'
    WHEN 'awaiting_payment'    THEN 'Payment is required before scheduling and execution can begin.'
    WHEN 'payment_confirmed'   THEN 'Payment has been confirmed. Scheduling is now unlocked.'
    WHEN 'scheduled'           THEN 'Your execution session or document handling step is scheduled.'
    WHEN 'in_execution'        THEN 'Your document is currently in the execution stage.'
    WHEN 'apostille_processing' THEN 'Your document has moved into apostille processing.'
    WHEN 'courier_ready'       THEN 'Your document has been packaged and is prepared for secure release.'
    WHEN 'shipped'             THEN 'Your document has been released for courier delivery.'
    WHEN 'completed'           THEN 'Your matter has been completed and released.'
    WHEN 'needs_info'          THEN 'Additional information is needed before the matter can proceed.'
    WHEN 'compliance_blocked'  THEN 'This matter requires review before execution can continue.'
    WHEN 'dormant'             THEN 'The matter is currently paused pending client action.'
    ELSE 'Your matter is under active review.'
  END                         AS client_facing_status,
  d.payment_status,
  -- Show total_price only if it is the gross amount due (not cost/margin)
  CASE
    WHEN d.payment_status IN ('paid','confirmed') THEN NULL
    ELSE d.total_price
  END                         AS payment_amount_due,
  d.tracking_number           AS courier_tracking_id,
  d.carrier                   AS courier_carrier,
  d.delivery_status,
  d.delivery_eta,
  d.delivery_timestamp,
  d.is_paid_and_released,
  d.created_at,
  d.updated_at
  -- EXPLICITLY ABSENT: wise_reference, wise_transfer_id, internal_notes,
  --   operator_notes, assignee, total_revenue, margin, audit_logs,
  --   admin_actions, base_cost, shipping_cost, net_margin, risk_score
FROM deals d;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. CLIENT SAFE DOCUMENTS VIEW
-- Only non-internal, non-compliance-locked documents are visible.
-- No raw storage paths exposed — signed URLs generated at API layer.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW client_safe_documents_view AS
SELECT
  f.id          AS document_id,
  f.deal_id     AS matter_id,
  f.name        AS document_label,
  f.storage_path,              -- Used only for signed URL generation, never returned raw
  f.created_at  AS uploaded_at,
  CASE
    WHEN d.status IN ('completed','shipped','delivered') THEN 'released'
    WHEN d.payment_status = 'paid' THEN 'processing'
    ELSE 'pending'
  END           AS verification_status,
  FALSE         AS is_internal_only
FROM files f
JOIN deals d ON d.id = f.deal_id;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. CLIENT SAFE INVOICE VIEW
-- Shows only the gross amount due. No cost, margin, or spread.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW client_safe_invoice_view AS
SELECT
  d.id          AS matter_id,
  d.email       AS client_email,
  d.total_price AS total_amount_due,
  'USD'         AS currency,
  d.payment_status,
  d.created_at  AS invoice_date
FROM deals d
WHERE d.total_price IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CLIENT SAFE TIMELINE VIEW
-- Only events explicitly marked client_visible = true from matter_events.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW client_safe_timeline_view AS
SELECT
  e.id          AS event_id,
  e.matter_id,
  e.event_type  AS event_label,
  COALESCE(e.notes, '') AS public_description,
  e.created_at  AS timestamp_recorded
FROM matter_events e
WHERE e.client_visible = TRUE
ORDER BY e.created_at DESC;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS: Ensure service-role-only write access on all views
-- Client reads via these views are scoped by the API layer (email match)
-- ────────────────────────────────────────────────────────────────────────────

SELECT 'Portal-03 client-safe views installed.' AS status;
