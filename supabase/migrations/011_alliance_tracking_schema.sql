-- ============================================================
-- MIGRATION 011 — Alliance Tracking Schema
-- P1/P2 GATED: DO NOT EXECUTE BEFORE P0 CLEARANCE
-- Prepared: MS-RECON-REFUNNEL-V2 / MS-RECON-MASTER-2026-V1
-- Status: PREPARED ONLY — AWAITING P1 GATE
-- ============================================================
-- This migration must not run until:
--   ✓ notifications table (009) is applied
--   ✓ SECURITY-06 is complete
--   ✓ portal sessions are HMAC-hardened
--   ✓ signed URLs are enforced on all document access
--   ✓ health routes exist and are verified
--   ✓ error logging is wired
--   ✓ mock/demo data is fully removed
--   ✓ smoke tests are documented and passing
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: alliance_partners
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alliance_partners (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           TEXT NOT NULL,
    email               TEXT NOT NULL UNIQUE,
    instagram_handle    TEXT,
    firm_name           TEXT,
    shipping_street     TEXT,
    shipping_city       TEXT,
    shipping_state      TEXT,
    shipping_zip        TEXT,
    shipping_country    TEXT DEFAULT 'US',
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alliance_partners_email    ON public.alliance_partners(email);
CREATE INDEX IF NOT EXISTS idx_alliance_partners_status   ON public.alliance_partners(status);

-- ------------------------------------------------------------
-- TABLE: alliance_campaigns
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alliance_campaigns (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id                  UUID REFERENCES public.alliance_partners(id) ON DELETE CASCADE,
    campaign_name               TEXT NOT NULL,

    -- U.S. domestic acquisition segmentation
    target_us_county            TEXT,   -- e.g. 'Pinellas', 'Miami-Dade', 'Orange'
    target_us_msa               TEXT,   -- e.g. 'Tampa Bay', 'Miami-Fort Lauderdale'

    -- International destination routing
    target_global_destination   TEXT,   -- e.g. 'Italy', 'UAE', 'Spain', 'Mexico', 'Brazil'
    target_protocol             TEXT    CHECK (target_protocol IN (
                                    'hague_apostille',
                                    'embassy_legalization',
                                    'state_authentication',
                                    'federal_apostille',
                                    'ron_only',
                                    'mobile_notary_only'
                                )),

    -- Partner and campaign classification
    partner_node_type           TEXT    CHECK (partner_node_type IN (
                                    'title_company',
                                    'luxury_real_estate',
                                    'foreign_law_firm',
                                    'immigration_firm',
                                    'wealth_manager',
                                    'corporate_services',
                                    'maritime',
                                    'equine',
                                    'private_client_advisor'
                                )),
    campaign_source             TEXT    CHECK (campaign_source IN (
                                    'instagram_whitelist',
                                    'linkedin_outreach',
                                    'gbp_post',
                                    'referral_partner',
                                    'email_campaign',
                                    'event_followup',
                                    'organic_search'
                                )),

    -- Attribution metadata
    meta_partnership_ad_id      TEXT,
    total_conversions           INTEGER NOT NULL DEFAULT 0,
    total_earnings              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alliance_campaigns_partner_id          ON public.alliance_campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_alliance_campaigns_target_us_county    ON public.alliance_campaigns(target_us_county);
CREATE INDEX IF NOT EXISTS idx_alliance_campaigns_target_global       ON public.alliance_campaigns(target_global_destination);
CREATE INDEX IF NOT EXISTS idx_alliance_campaigns_campaign_source     ON public.alliance_campaigns(campaign_source);
CREATE INDEX IF NOT EXISTS idx_alliance_campaigns_is_active           ON public.alliance_campaigns(is_active);

-- ------------------------------------------------------------
-- TABLE: alliance_payouts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alliance_payouts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id          UUID NOT NULL REFERENCES public.alliance_partners(id) ON DELETE RESTRICT,
    campaign_id         UUID REFERENCES public.alliance_campaigns(id) ON DELETE SET NULL,
    amount              NUMERIC(12, 2) NOT NULL,
    payout_status       TEXT NOT NULL DEFAULT 'pending'
                            CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    wise_transfer_id    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alliance_payouts_partner_id    ON public.alliance_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_alliance_payouts_status        ON public.alliance_payouts(payout_status);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — FAIL CLOSED
-- ------------------------------------------------------------
ALTER TABLE public.alliance_partners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliance_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliance_payouts   ENABLE ROW LEVEL SECURITY;

-- Service role: full access to all three tables
CREATE POLICY "service_role_full_access_alliance_partners"
    ON public.alliance_partners TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_alliance_campaigns"
    ON public.alliance_campaigns TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_alliance_payouts"
    ON public.alliance_payouts TO service_role
    USING (true) WITH CHECK (true);

-- Admin/operator read-only (no public or partner-facing access)
CREATE POLICY "operator_read_alliance_partners"
    ON public.alliance_partners FOR SELECT TO authenticated
    USING (
        current_setting('request.jwt.claims', true)::jsonb ->> 'email'
        = ANY(string_to_array(current_setting('app.operator_emails', true), ','))
    );

CREATE POLICY "operator_read_alliance_campaigns"
    ON public.alliance_campaigns FOR SELECT TO authenticated
    USING (
        current_setting('request.jwt.claims', true)::jsonb ->> 'email'
        = ANY(string_to_array(current_setting('app.operator_emails', true), ','))
    );

CREATE POLICY "operator_read_alliance_payouts"
    ON public.alliance_payouts FOR SELECT TO authenticated
    USING (
        current_setting('request.jwt.claims', true)::jsonb ->> 'email'
        = ANY(string_to_array(current_setting('app.operator_emails', true), ','))
    );

-- ============================================================
-- TRACKING ARCHITECTURE RULES (preserved per MS-RECON-MASTER-2026-V1)
-- ============================================================
-- 1. Florida Notary / RON execution authority: STATEWIDE — all 67 counties uniform.
--    Do not create county-level notary authority records.
--
-- 2. Acquisition tracking: COUNTY/MSA SEGMENTED.
--    target_us_county and target_us_msa provide granular conversion attribution
--    per regional B2B partner node (title cos, RE brokers, immigration firms, etc.)
--
-- 3. International routing: DESTINATION-COUNTRY/PROTOCOL SEGMENTED.
--    target_global_destination + target_protocol drive the international rail.
--    County tracking does not apply to international document flows.
--
-- These three layers must never be collapsed into a single dimension.
-- ============================================================
