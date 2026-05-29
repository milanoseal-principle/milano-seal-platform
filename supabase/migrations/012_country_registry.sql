-- ============================================================
-- MIGRATION 012 — Country Registry + Featured Globe Destinations
-- P1 GATED: DO NOT EXECUTE BEFORE P0 CLEARANCE
-- Source: MS-RECON-MASTER-2026-V1 / Globe–IntelMap Architecture Rule
-- Status: PREPARED ONLY — AWAITING P1 GATE
-- ============================================================
-- Architecture rule preserved verbatim:
--
--   Small visible globe.
--   Large invisible intelligence registry.
--   Expandable compliance map.
--   Dashboard-level country intelligence.
--   SEO-priority publishing queue.
--
-- The IntelligenceRail and homepage globe should consume
-- ONLY featured_globe_destinations.
-- All other country intelligence lives in country_registry.
-- alliance_campaigns.target_global_destination references country_registry.slug.
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: country_registry
-- The authoritative backend intelligence layer.
-- Powers: intake routing, compliance notes, dashboard filters,
--         SEO publishing queue, alliance destination routing.
-- Does NOT control what glows on the homepage globe.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.country_registry (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name            TEXT NOT NULL,
    slug                    TEXT NOT NULL UNIQUE,   -- e.g. 'italy', 'uae', 'brazil'
    region                  TEXT,                   -- e.g. 'Western Europe', 'Middle East', 'Latin America'
    hague_status            TEXT NOT NULL DEFAULT 'unknown'
                                CHECK (hague_status IN (
                                    'member',       -- Full Hague Convention member
                                    'non_member',   -- Not a member, embassy/consular path
                                    'pending',      -- Pending accession or recent joiner
                                    'unknown'
                                )),
    protocol                TEXT NOT NULL DEFAULT 'hague_apostille'
                                CHECK (protocol IN (
                                    'hague_apostille',
                                    'embassy_legalization',
                                    'state_authentication',
                                    'federal_apostille',
                                    'dual_path'     -- country accepts both routes
                                )),
    translation_required    BOOLEAN NOT NULL DEFAULT FALSE,
    consular_required       BOOLEAN NOT NULL DEFAULT FALSE,
    common_documents        TEXT[],                 -- e.g. ARRAY['birth certificate','power of attorney']
    operator_notes          TEXT,                   -- Internal operator guidance — not public
    public_summary          TEXT,                   -- Safe public-facing summary for SEO/intake
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    seo_priority            INTEGER NOT NULL DEFAULT 3
                                CHECK (seo_priority BETWEEN 1 AND 3),
                                -- 1 = build now, 2 = next expansion, 3 = future queue
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_country_registry_slug          ON public.country_registry(slug);
CREATE INDEX IF NOT EXISTS idx_country_registry_hague         ON public.country_registry(hague_status);
CREATE INDEX IF NOT EXISTS idx_country_registry_protocol      ON public.country_registry(protocol);
CREATE INDEX IF NOT EXISTS idx_country_registry_seo_priority  ON public.country_registry(seo_priority);
CREATE INDEX IF NOT EXISTS idx_country_registry_is_active     ON public.country_registry(is_active);

-- ------------------------------------------------------------
-- TABLE: featured_globe_destinations
-- Controls what appears on the homepage globe and IntelligenceRail.
-- This is NOT the full country registry.
-- The globe should feel elite — restrained — premium.
-- Do not add every country here.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.featured_globe_destinations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_slug        TEXT NOT NULL REFERENCES public.country_registry(slug) ON DELETE CASCADE,
    display_label       TEXT NOT NULL,              -- e.g. 'Italy'
    route_label         TEXT NOT NULL,              -- e.g. 'Apostille Validation Active'
    priority_order      INTEGER NOT NULL DEFAULT 99,
    globe_lat           NUMERIC(8,5),               -- latitude for globe marker positioning
    globe_lng           NUMERIC(8,5),               -- longitude for globe marker positioning
    glow_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    rail_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    homepage_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    intake_quick_select BOOLEAN NOT NULL DEFAULT FALSE,
    seo_priority        INTEGER NOT NULL DEFAULT 2
                            CHECK (seo_priority BETWEEN 1 AND 3),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (country_slug)
);

CREATE INDEX IF NOT EXISTS idx_globe_dest_priority      ON public.featured_globe_destinations(priority_order);
CREATE INDEX IF NOT EXISTS idx_globe_dest_rail_enabled  ON public.featured_globe_destinations(rail_enabled);
CREATE INDEX IF NOT EXISTS idx_globe_dest_homepage      ON public.featured_globe_destinations(homepage_enabled);

-- ------------------------------------------------------------
-- SEED: country_registry — Tier 1 Active Globe Countries
-- ------------------------------------------------------------
INSERT INTO public.country_registry
    (country_name, slug, region, hague_status, protocol, translation_required, consular_required, seo_priority, public_summary)
VALUES
    ('Italy',          'italy',         'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 1,
     'Italy is a Hague Convention member. Florida apostilles are accepted for most civil and commercial documents.'),
    ('Spain',          'spain',         'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 1,
     'Spain is a Hague Convention member. Apostille coordination through the Florida Department of State.'),
    ('United Arab Emirates', 'uae',     'Middle East',      'non_member', 'embassy_legalization',  TRUE, TRUE,  1,
     'The UAE is not a Hague member. Documents require state authentication followed by UAE Embassy legalization.'),
    ('Brazil',         'brazil',        'Latin America',    'member',     'hague_apostille',      FALSE, FALSE, 1,
     'Brazil is a Hague Convention member. Apostille pathway available for most notarized documents.'),
    ('Mexico',         'mexico',        'Latin America',    'member',     'hague_apostille',      FALSE, FALSE, 1,
     'Mexico is a Hague Convention member. Cross-border notarial routing via apostille pathway.'),
    ('United States',  'united-states', 'North America',   'member',     'federal_apostille',    FALSE, FALSE, 1,
     'Statewide RON authority. Florida notary commission valid across all 67 counties.')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- SEED: country_registry — Tier 2 Next Expansion Countries
-- ------------------------------------------------------------
INSERT INTO public.country_registry
    (country_name, slug, region, hague_status, protocol, translation_required, consular_required, seo_priority)
VALUES
    ('Portugal',       'portugal',      'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('Germany',        'germany',       'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('Greece',         'greece',        'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('Canada',         'canada',        'North America',    'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('United Kingdom', 'united-kingdom','Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('Colombia',       'colombia',      'Latin America',    'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('Argentina',      'argentina',     'Latin America',    'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('France',         'france',        'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 2),
    ('Ireland',        'ireland',       'Western Europe',   'member',     'hague_apostille',      FALSE, FALSE, 2)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- SEED: featured_globe_destinations — Tier 1 only
-- These match the current IntelligenceRail entries exactly.
-- After P1 gate, IntelligenceRail.tsx should query this table
-- instead of the hardcoded GLOBAL_ROUTES array.
-- ------------------------------------------------------------
INSERT INTO public.featured_globe_destinations
    (country_slug, display_label, route_label, priority_order, globe_lat, globe_lng,
     glow_enabled, rail_enabled, homepage_enabled, intake_quick_select, seo_priority)
VALUES
    ('italy',         'Italy',         'Apostille Validation Active',         1,  41.90278,  12.49636, TRUE, TRUE, TRUE, TRUE,  1),
    ('spain',         'Spain',         'Hague Route Review',                  2,  40.41650,  -3.70256, TRUE, TRUE, TRUE, TRUE,  1),
    ('uae',           'UAE',           'Consular Authentication Workflow',    3,  23.42408,  53.84780, TRUE, TRUE, TRUE, TRUE,  1),
    ('brazil',        'Brazil',        'Document Authentication Sequence',    4, -14.23500, -51.92500, TRUE, TRUE, TRUE, TRUE,  1),
    ('mexico',        'Mexico',        'Cross-Border Notarial Routing',       5,  23.63450, -102.5528, TRUE, TRUE, TRUE, TRUE,  1),
    ('united-states', 'Florida',       'Execution Origin / Notarial Commission', 6, 27.99430, -81.76010, TRUE, TRUE, TRUE, FALSE, 1)
ON CONFLICT (country_slug) DO NOTHING;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE public.country_registry           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_globe_destinations ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "service_role_country_registry"
    ON public.country_registry TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "service_role_globe_destinations"
    ON public.featured_globe_destinations TO service_role
    USING (true) WITH CHECK (true);

-- Public: read active, non-operator-notes rows from country_registry
CREATE POLICY "public_read_active_countries"
    ON public.country_registry FOR SELECT TO anon
    USING (is_active = true);

-- Public: read featured globe destinations (homepage globe data)
CREATE POLICY "public_read_featured_globe"
    ON public.featured_globe_destinations FOR SELECT TO anon
    USING (homepage_enabled = true);

-- Authenticated (operators): full read on both tables
CREATE POLICY "operator_read_country_registry"
    ON public.country_registry FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "operator_read_globe_destinations"
    ON public.featured_globe_destinations FOR SELECT TO authenticated
    USING (true);

-- ============================================================
-- POST-MIGRATION INTEGRATION NOTES (P1 action items)
-- ============================================================
-- 1. Update IntelligenceRail.tsx to query featured_globe_destinations
--    via /api/countries/featured instead of hardcoded GLOBAL_ROUTES array.
--
-- 2. Create /api/countries/featured route: SELECT from featured_globe_destinations
--    JOIN country_registry ON slug WHERE homepage_enabled=true ORDER BY priority_order.
--
-- 3. Create /api/countries/search route: SELECT from country_registry
--    WHERE is_active=true, supports ?q=, ?hague_status=, ?protocol= filters.
--    Powers intake country search (full registry) and dashboard filters.
--
-- 4. Update alliance_campaigns.target_global_destination to enforce FK:
--    ADD CONSTRAINT fk_campaign_country
--    FOREIGN KEY (target_global_destination) REFERENCES country_registry(slug);
--
-- 5. SEO page generation: query country_registry WHERE seo_priority=1
--    to populate /countries/[slug] static params instead of hardcoded list.
--
-- DO NOT implement items 1–5 until P0 clearance is confirmed.
-- ============================================================
