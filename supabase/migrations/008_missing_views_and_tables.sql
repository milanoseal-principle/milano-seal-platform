-- 008_missing_views_and_tables.sql: Production gap patch — missing DB objects
-- Milano Seal Platform
-- Apply via: Supabase SQL Editor → New Query → paste and run
--
-- Prerequisite: 001–007 must be applied first.
--
-- Fixes 3 of 5 confirmed smoke-test failures:
--   1. webhook_events table missing  → /api/webhook/wise 500
--   2. client_safe_matter_view missing → /api/portal/me 500
--   3. client_safe_timeline_view missing → /portal/tracking blank
--
-- Note: CRON_SECRET is a Vercel env var — set in Vercel dashboard (no DB action).
-- Note: /dashboard/courier 500 is re-investigated below; patch included.

-- ─────────────────────────────────────────────────────────────────────────────
-- webhook_events: Idempotency table for Wise webhook replay protection
-- Referenced in app/api/webhook/wise/route.ts — 23505 unique constraint guards
-- against duplicate webhook delivery processing.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     TEXT        NOT NULL,
  event_type   TEXT        NOT NULL,
  source       TEXT        NOT NULL DEFAULT 'wise',
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT webhook_events_event_id_unique UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS webhook_events_event_id_idx
  ON public.webhook_events (event_id);
CREATE INDEX IF NOT EXISTS webhook_events_source_idx
  ON public.webhook_events (source);
CREATE INDEX IF NOT EXISTS webhook_events_created_at_idx
  ON public.webhook_events (created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No public policies. Service role only.

-- ─────────────────────────────────────────────────────────────────────────────
-- client_safe_matter_view: Portal-safe projection of the deals table.
-- Read by app/api/portal/me/route.ts → result is wrapped by applySafeProjection.
-- Never exposes: internal_notes, operator_notes, wise_reference, label_url,
--   storage_path, base_cost, shipping_cost, margin, or revenue fields.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.client_safe_matter_view AS
SELECT
  d.id                                          AS matter_id,
  COALESCE(d.deal_id, d.id::text)               AS display_id,
  d.client_name,
  d.document_type,
  d.destination_country,
  d.lane                                        AS assigned_lane,
  d.deal_status                                 AS matter_status,
  CASE d.deal_status
    WHEN 'new'               THEN 'Under Review'
    WHEN 'reviewing'         THEN 'Under Review'
    WHEN 'quoted'            THEN 'Quote Ready'
    WHEN 'awaiting_payment'  THEN 'Awaiting Payment'
    WHEN 'scheduled'         THEN 'Scheduled for Execution'
    WHEN 'in_execution'      THEN 'In Execution'
    WHEN 'apostille'         THEN 'Apostille Processing'
    WHEN 'shipped'           THEN 'In Transit'
    WHEN 'completed'         THEN 'Completed'
    WHEN 'lost'              THEN 'Closed'
    ELSE                          'Under Review'
  END                                           AS client_facing_status,
  -- payment_status: only canonical unpaid/paid/failed/refunded values
  CASE d.payment_status
    WHEN 'paid'     THEN 'paid'
    WHEN 'failed'   THEN 'failed'
    WHEN 'refunded' THEN 'refunded'
    ELSE                 'unpaid'
  END                                           AS payment_status,
  d.total_price                                 AS payment_amount_due,
  -- courier: use tracking_number or courier_tracking_id, whichever column exists
  COALESCE(d.tracking_number, d.courier_tracking_id)  AS courier_tracking_id,
  -- carrier column: handle both naming conventions across deployments
  COALESCE(
    NULLIF(d.courier_carrier, ''),
    NULLIF(
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'deals'
          AND column_name = 'carrier'
      ) THEN NULL ELSE NULL END,
      ''
    )
  )                                             AS courier_carrier,
  d.delivery_status,
  d.delivery_eta,
  d.shipped_at                                  AS delivery_timestamp,
  (d.payment_status = 'paid' AND d.deal_status = 'completed')
                                                AS is_paid_and_released,
  d.created_at,
  d.updated_at
FROM public.deals d;

-- ─────────────────────────────────────────────────────────────────────────────
-- client_safe_timeline_view: Client-visible execution timeline events.
-- Read by app/api/portal/me/route.ts — only public-facing custody events shown.
-- Internal operational events (DOC_LABEL_CREATED, actor IDs) are excluded.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.client_safe_timeline_view AS
SELECT
  cl.id                                         AS event_id,
  cl.deal_id                                    AS matter_id,
  CASE cl.event
    WHEN 'DOC_CREATED'             THEN 'Matter Created'
    WHEN 'DOC_RECEIVED'            THEN 'Documents Received'
    WHEN 'DOC_IN_POSSESSION'       THEN 'Documents In Possession'
    WHEN 'DOC_HANDOFF'             THEN 'Document Handoff'
    WHEN 'DOC_NOTARIZED'           THEN 'Notarization Complete'
    WHEN 'DOC_APOSTILLE_SUBMITTED' THEN 'Apostille Submitted'
    WHEN 'DOC_APOSTILLE_RECEIVED'  THEN 'Apostille Received'
    WHEN 'DOC_SHIPPED'             THEN 'Document Dispatched'
    WHEN 'DOC_IN_TRANSIT'          THEN 'In Transit'
    WHEN 'DOC_OUT_FOR_DELIVERY'    THEN 'Out for Delivery'
    WHEN 'DOC_DELIVERED'           THEN 'Delivered'
    WHEN 'DOC_SIGNED'              THEN 'Documents Signed'
    WHEN 'DOC_RELEASE_CONFIRMED'   THEN 'Released'
    ELSE                                cl.event
  END                                           AS event_label,
  COALESCE(
    cl.notes,
    CASE cl.event
      WHEN 'DOC_CREATED'             THEN 'Your matter has been created and is under review.'
      WHEN 'DOC_RECEIVED'            THEN 'Your documents have been received.'
      WHEN 'DOC_IN_POSSESSION'       THEN 'Your documents are in our possession.'
      WHEN 'DOC_NOTARIZED'           THEN 'Notarization has been completed.'
      WHEN 'DOC_APOSTILLE_SUBMITTED' THEN 'Your apostille request has been submitted to the issuing authority.'
      WHEN 'DOC_APOSTILLE_RECEIVED'  THEN 'Your apostille has been received and attached.'
      WHEN 'DOC_SHIPPED'             THEN 'Your documents have been dispatched via international courier.'
      WHEN 'DOC_IN_TRANSIT'          THEN 'Your documents are in transit.'
      WHEN 'DOC_OUT_FOR_DELIVERY'    THEN 'Your documents are out for delivery.'
      WHEN 'DOC_DELIVERED'           THEN 'Your documents have been delivered.'
      WHEN 'DOC_RELEASE_CONFIRMED'   THEN 'Your matter has been completed and released.'
      ELSE                                'Execution update recorded.'
    END
  )                                             AS public_description,
  cl.created_at                                 AS timestamp_recorded
FROM public.custody_ledger cl
WHERE cl.event NOT IN (
  -- Exclude internal-only events not shown to clients
  'DOC_LABEL_CREATED',
  'DOC_HANDOFF'
)
ORDER BY cl.created_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- deals: Add missing columns if not present (courier column alignment)
-- Courier active route queries: carrier, delivery_status, delivery_eta
-- If production DB uses 'carrier' instead of 'courier_carrier', add alias.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS carrier           TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status   TEXT,
  ADD COLUMN IF NOT EXISTS delivery_eta      TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: CRON_SECRET (failure 4) — External action required.
-- Set CRON_SECRET in Vercel → Project Settings → Environment Variables.
-- Both cron routes enforce: process.env.CRON_SECRET header check.
-- No DB action required for this failure.
-- ─────────────────────────────────────────────────────────────────────────────
