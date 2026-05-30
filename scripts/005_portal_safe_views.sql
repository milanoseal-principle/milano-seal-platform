-- THE MILANO SEAL™ — PORTAL-03: CLIENT-SAFE DATA BOUNDARY VIEWS
-- LOCKED VERSION
-- Run AFTER scripts 001–004 in Supabase SQL Editor.
-- These views are the ONLY source of data for the client portal.
-- Structural guarantee: no internal cost, margin, operator notes, or raw storage paths.

-- ────────────────────────────────────────────────────────────────────────────
-- 0. SCHEMA PATCHES — columns required by the views below.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS total_price           NUMERIC,
  ADD COLUMN IF NOT EXISTS tracking_number       TEXT,
  ADD COLUMN IF NOT EXISTS carrier               TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_eta          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_timestamp    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_paid_and_released  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS internal_notes        TEXT,
  ADD COLUMN IF NOT EXISTS assignee              TEXT,
  ADD COLUMN IF NOT EXISTS wise_reference        TEXT,
  ADD COLUMN IF NOT EXISTS wise_transfer_id      TEXT,
  ADD COLUMN IF NOT EXISTS signed_by             TEXT,
  ADD COLUMN IF NOT EXISTS ship_to               JSONB,
  ADD COLUMN IF NOT EXISTS evidence_url          TEXT,
  ADD COLUMN IF NOT EXISTS evidence_path         TEXT,
  ADD COLUMN IF NOT EXISTS evidence_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS label_url             TEXT;

-- Files table — needed by vault API. Raw storage_path stays in base table only.
CREATE TABLE IF NOT EXISTS public.files (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id      UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  name         TEXT,
  filename     TEXT,
  file_url     TEXT,
  file_path    TEXT,
  storage_path TEXT,
  file_type    TEXT,
  file_size    BIGINT,
  uploaded_by  TEXT DEFAULT 'client',
  is_internal  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_files_deal ON public.files(deal_id);
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_files" ON public.files;
CREATE POLICY "svc_files"
ON public.files
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Matter events table — needed by client_safe_timeline_view.
CREATE TABLE IF NOT EXISTS public.matter_events (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  matter_id        UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  event_type       TEXT NOT NULL,
  notes            TEXT,
  actor            TEXT,
  client_visible   BOOLEAN DEFAULT FALSE,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_matter_events_matter ON public.matter_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_events_visible ON public.matter_events(matter_id, client_visible);
CREATE INDEX IF NOT EXISTS idx_matter_events_created ON public.matter_events(created_at DESC);
ALTER TABLE public.matter_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_matter_events" ON public.matter_events;
CREATE POLICY "svc_matter_events"
ON public.matter_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CLIENT SAFE MATTER VIEW
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.client_safe_matter_view AS
SELECT
  d.id AS matter_id,
  d.id AS display_id,
  d.email AS client_email,
  d.client_name,
  d.document_type,
  d.destination_country,
  COALESCE(d.service_type, 'Standard Execution') AS assigned_lane,
  d.status AS matter_status,
  CASE d.status
    WHEN 'new' THEN 'Your matter has been received and is being structured for review.'
    WHEN 'intake_received' THEN 'Your matter has been received and is being structured for review.'
    WHEN 'under_review' THEN 'Your document path is being reviewed for execution readiness and international use.'
    WHEN 'compliance_review' THEN 'This matter requires review before execution can continue.'
    WHEN 'quoted' THEN 'Your execution proposal is ready.'
    WHEN 'awaiting_payment' THEN 'Payment is required before scheduling and execution can begin.'
    WHEN 'payment_confirmed' THEN 'Payment has been confirmed. Scheduling is now unlocked.'
    WHEN 'scheduled' THEN 'Your execution session or document handling step is scheduled.'
    WHEN 'in_execution' THEN 'Your document is currently in the execution stage.'
    WHEN 'apostille_processing' THEN 'Your document has moved into apostille processing.'
    WHEN 'courier_ready' THEN 'Your document has been packaged and is prepared for secure release.'
    WHEN 'shipped' THEN 'Your document has been released for courier delivery.'
    WHEN 'completed' THEN 'Your matter has been completed and released.'
    WHEN 'needs_info' THEN 'Additional information is needed before the matter can proceed.'
    WHEN 'compliance_blocked' THEN 'This matter requires review before execution can continue.'
    WHEN 'dormant' THEN 'The matter is currently paused pending client action.'
    ELSE 'Your matter is under active review.'
  END AS client_facing_status,
  d.payment_status,
  CASE
    WHEN d.payment_status IN ('paid', 'confirmed') THEN NULL
    ELSE d.total_price
  END AS payment_amount_due,
  d.tracking_number AS courier_tracking_id,
  d.carrier AS courier_carrier,
  d.delivery_status,
  d.delivery_eta,
  d.delivery_timestamp,
  d.is_paid_and_released,
  d.created_at,
  d.updated_at
FROM public.deals d;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. CLIENT SAFE DOCUMENTS VIEW
-- No raw storage_path/file_path/file_url/evidence path fields are exposed here.
-- Signed URLs are generated only at the server API layer after entitlement checks.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.client_safe_documents_view AS
SELECT
  f.id AS document_id,
  f.deal_id AS matter_id,
  COALESCE(f.name, f.filename, 'Document') AS document_label,
  f.file_type,
  f.file_size,
  f.created_at AS uploaded_at,
  CASE
    WHEN d.status IN ('completed', 'shipped', 'delivered') THEN 'released'
    WHEN d.payment_status = 'paid' THEN 'processing'
    ELSE 'pending'
  END AS verification_status,
  FALSE AS is_internal_only
FROM public.files f
JOIN public.deals d ON d.id = f.deal_id
WHERE COALESCE(f.is_internal, FALSE) = FALSE;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. CLIENT SAFE INVOICE VIEW
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.client_safe_invoice_view AS
SELECT
  d.id AS matter_id,
  d.email AS client_email,
  d.total_price AS total_amount_due,
  'USD' AS currency,
  d.payment_status,
  d.created_at AS invoice_date
FROM public.deals d
WHERE d.total_price IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CLIENT SAFE TIMELINE VIEW
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.client_safe_timeline_view AS
SELECT
  e.id AS event_id,
  e.matter_id,
  e.event_type AS event_label,
  COALESCE(e.notes, '') AS public_description,
  e.created_at AS timestamp_recorded
FROM public.matter_events e
WHERE e.client_visible = TRUE
ORDER BY e.created_at DESC;

SELECT 'Portal-03 locked client-safe views installed. No raw storage fields exposed.' AS status;
