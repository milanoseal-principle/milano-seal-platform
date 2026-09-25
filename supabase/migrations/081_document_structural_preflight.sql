-- Migration 081: governed document structural preflight.
-- Extends the canonical files table used by /api/upload.
-- The original storage object remains immutable; preflight stores derived evidence only.

ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS sha256 TEXT,
  ADD COLUMN IF NOT EXISTS signature_detected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certification_signature_detected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS encryption_detected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS structural_status TEXT,
  ADD COLUMN IF NOT EXISTS structural_review_reason TEXT,
  ADD COLUMN IF NOT EXISTS preflight_scanner_version TEXT,
  ADD COLUMN IF NOT EXISTS preflight_checked_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'files_structural_status_check'
      AND conrelid = 'public.files'::regclass
  ) THEN
    ALTER TABLE public.files
      ADD CONSTRAINT files_structural_status_check
      CHECK (
        structural_status IS NULL OR
        structural_status IN ('READY', 'REVIEW_REQUIRED', 'BLOCKED')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_files_structural_status
  ON public.files(structural_status);

CREATE INDEX IF NOT EXISTS idx_files_sha256
  ON public.files(sha256);

CREATE INDEX IF NOT EXISTS idx_files_deal_preflight
  ON public.files(deal_id, structural_status, preflight_checked_at DESC);
