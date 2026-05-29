-- 007_deals_loss_relationship.sql: Add loss tracking and relationship intelligence fields
-- Milano Seal Platform
-- Apply via: Supabase SQL Editor → New Query → paste and run
--
-- Prerequisite: 006_operational_tables.sql must be applied first.

-- ─────────────────────────────────────────────────────────────────────────────
-- deals: Loss tracking fields
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS loss_reason           TEXT,
  ADD COLUMN IF NOT EXISTS lost_stage            TEXT,
  ADD COLUMN IF NOT EXISTS lost_notes_internal   TEXT,
  ADD COLUMN IF NOT EXISTS competitor_name       TEXT,
  ADD COLUMN IF NOT EXISTS lost_at               TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- deals: Relationship intelligence fields (operator/dashboard-only)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS relationship_tier     TEXT
    CHECK (relationship_tier IN ('standard', 'priority', 'vip', 'strategic')),
  ADD COLUMN IF NOT EXISTS referred_by           TEXT,
  ADD COLUMN IF NOT EXISTS attorney_link         TEXT,
  ADD COLUMN IF NOT EXISTS client_lifetime_value NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS repeat_client         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trust_level           TEXT
    CHECK (trust_level IN ('new', 'verified', 'trusted', 'strategic'));

-- Index on trust_level and relationship_tier for operator filtering
CREATE INDEX IF NOT EXISTS idx_deals_relationship_tier ON deals(relationship_tier);
CREATE INDEX IF NOT EXISTS idx_deals_trust_level ON deals(trust_level);
