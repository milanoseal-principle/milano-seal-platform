-- 026_document_lifecycle_governance.sql
-- Document lifecycle governance and validity tracking

CREATE TABLE IF NOT EXISTS public.document_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL,
  document_id UUID,
  previous_status TEXT,
  next_status TEXT NOT NULL,
  reason TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system',
  actor_id UUID,
  client_safe_summary TEXT,
  operator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_validity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL,
  document_id UUID,
  document_type TEXT,
  issue_date DATE,
  expiration_date DATE,
  validity_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  destination_country TEXT,
  receiving_authority TEXT,
  translation_required BOOLEAN NOT NULL DEFAULT false,
  authentication_required BOOLEAN NOT NULL DEFAULT false,
  apostille_required BOOLEAN NOT NULL DEFAULT false,
  manual_review_required BOOLEAN NOT NULL DEFAULT true,
  client_safe_summary TEXT,
  operator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_validity_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_lifecycle_operator_read" ON public.document_lifecycle_events;
CREATE POLICY "document_lifecycle_operator_read"
ON public.document_lifecycle_events FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "document_validity_operator_read" ON public.document_validity_checks;
CREATE POLICY "document_validity_operator_read"
ON public.document_validity_checks FOR SELECT
USING (auth.uid() IS NOT NULL);
