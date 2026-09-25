-- Migration 081: governed document structural preflight.
-- Extends the canonical files table used by /api/upload.
-- The original storage object remains immutable; preflight stores derived evidence only.

-- Reconcile the two column dialects already used against public.files:
-- /api/upload writes filename/file_type/file_size, while /api/intake/upload,
-- RON readiness and BlueNotary session seeding use name/mime_type/size_bytes/
-- category/is_internal. Both sets must exist for preflight readiness to see
-- every execution document.
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

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
