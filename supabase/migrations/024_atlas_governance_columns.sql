-- 024_atlas_governance_columns.sql
-- Atlas governance columns for country_registry table

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'country_registry' AND table_schema = 'public') THEN
    -- Add governance columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='source_confidence') THEN
      ALTER TABLE country_registry ADD COLUMN source_confidence TEXT DEFAULT 'UNVERIFIED_REVIEW_REQUIRED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='last_verified_at') THEN
      ALTER TABLE country_registry ADD COLUMN last_verified_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='verified_by') THEN
      ALTER TABLE country_registry ADD COLUMN verified_by UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='stale_after_days') THEN
      ALTER TABLE country_registry ADD COLUMN stale_after_days INTEGER DEFAULT 180;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='routing_status') THEN
      ALTER TABLE country_registry ADD COLUMN routing_status TEXT DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='governance_notes') THEN
      ALTER TABLE country_registry ADD COLUMN governance_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='flagged_for_review') THEN
      ALTER TABLE country_registry ADD COLUMN flagged_for_review BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='country_registry' AND column_name='manual_review_required') THEN
      ALTER TABLE country_registry ADD COLUMN manual_review_required BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;
