-- SECURITY-04: Row-Level Security policies and storage isolation
-- Milano Seal Platform
-- Apply via: supabase db push or psql against your Supabase project
--
-- Prerequisite: 001_initial_schema.sql must be applied first.
-- All policies are idempotent. Storage policies are skipped outside Supabase.

DROP POLICY IF EXISTS "Service role full access" ON public.deals;
DROP POLICY IF EXISTS "client_own_deal" ON public.deals;
CREATE POLICY "client_own_deal"
  ON public.deals
  FOR ALL
  TO authenticated
  USING  (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_own_deal_files" ON public.files;
CREATE POLICY "client_own_deal_files"
  ON public.files
  FOR SELECT
  TO authenticated
  USING (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_own_payments" ON public.payments;
CREATE POLICY "client_own_payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (payer_email = (auth.jwt() ->> 'email'));

ALTER TABLE IF EXISTS public.portal_otps ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.custody_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_own_custody_read" ON public.custody_ledger;
CREATE POLICY "client_own_custody_read"
  ON public.custody_ledger
  FOR SELECT
  TO authenticated
  USING (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

ALTER TABLE IF EXISTS public.compliance_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_compliance" ON public.compliance_rules;
CREATE POLICY "public_read_compliance"
  ON public.compliance_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Supabase Storage is not present in plain PostgreSQL shadow databases.
-- Guarding the virtual table keeps local/fresh-chain validation deterministic.
DO $storage_policies$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage.objects is unavailable; skipping storage policies in this environment';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "client_read_own_evidence" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "client_read_own_documents" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "client_read_own_deal_documents" ON storage.objects';

  EXECUTE $policy$
    CREATE POLICY "client_read_own_evidence"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'evidence'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.deals
          WHERE email = (auth.jwt() ->> 'email')
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_read_own_documents"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.deals
          WHERE email = (auth.jwt() ->> 'email')
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "client_read_own_deal_documents"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'deal-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.deals
          WHERE email = (auth.jwt() ->> 'email')
        )
      )
  $policy$;
END
$storage_policies$;

-- Remaining known schema boundaries are intentionally enforced at the app layer:
-- deals.assignee is TEXT rather than an auth.users UUID, this is a single-tenant
-- deployment, OTP storage remains service-role-only, and payment writes remain
-- webhook/service-role-only.
