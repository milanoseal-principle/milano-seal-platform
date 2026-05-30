-- SECURITY-04: Row-Level Security policies and storage isolation
-- Milano Seal Platform
-- Apply via: supabase db push or psql against your Supabase project
--
-- Prerequisite: 001_audit_security_events.sql must be applied first.
--
-- SCHEMA GAP DISCLOSURE (honest, not faked):
--   deals.assignee is a TEXT string (name or email), not a UUID FK to
--   auth.users. Per-operator row isolation at the DB level is impossible
--   until a future migration adds deals.assignee_user_id.
--   All operator API routes use the service_role client which bypasses
--   RLS entirely — so operator access is controlled at the app layer.
--
--   Current RLS threat model:
--     service_role (createAdminClient)  → bypasses RLS on all tables
--     authenticated (Supabase session)  → own deals by email match only
--     anon (leaked anon key, direct API) → denied on all sensitive tables
-- ============================================================


-- ============================================================
-- 1. deals — fix the existing overly-permissive policy
-- ============================================================
-- The original script created "Service role full access" with USING (true)
-- which grants SELECT/INSERT/UPDATE/DELETE to ALL roles, including anon.
-- Drop it and replace with a scoped authenticated-user policy.

DROP POLICY IF EXISTS "Service role full access" ON public.deals;

-- Authenticated clients: full CRUD on their own deal row only.
-- Operators access deals exclusively via the service_role client (bypasses RLS).
CREATE POLICY "client_own_deal"
  ON public.deals
  FOR ALL
  TO authenticated
  USING  (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

-- anon role: no policy = default deny (RLS blocks all direct access).


-- ============================================================
-- 2. files — enable RLS, scope to owning deal by email
-- ============================================================

ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;

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

-- Insert/update/delete on files: service_role only.
-- App layer (upload route) uses createAdminClient() and validates actor first.


-- ============================================================
-- 3. messages — enable RLS, no direct client access
-- ============================================================
-- Messages are internal SMS/email records. Clients have no business
-- reading raw Twilio records directly; any client-facing history
-- is served through a scoped API endpoint.

ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- No authenticated policy: service_role only. Zero direct access.


-- ============================================================
-- 4. payments — enable RLS, scope SELECT to payer_email
-- ============================================================

ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- Clients may view payment records where they are the payer.
-- Note: matter_id references deals.id (UUID) but no consistent FK
-- join is safe here — payer_email is the reliable client scope column.
CREATE POLICY "client_own_payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (payer_email = (auth.jwt() ->> 'email'));

-- Insert/update/delete: service_role only (Stripe webhook handler).


-- ============================================================
-- 5. portal_otps — enable RLS, no direct access at all
-- ============================================================
-- OTPs must only be touched by the app layer via service_role.
-- Direct reads by any authenticated user would expose active tokens.

ALTER TABLE IF EXISTS public.portal_otps ENABLE ROW LEVEL SECURITY;

-- No policies: service_role only. Zero direct access for anon or authenticated.


-- ============================================================
-- 6. custody_ledger — enable RLS, read-only for own deals
-- ============================================================

ALTER TABLE IF EXISTS public.custody_ledger ENABLE ROW LEVEL SECURITY;

-- Clients may view their own chain of custody records.
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

-- Hash-chained inserts must be server-side (service_role) to preserve chain integrity.


-- ============================================================
-- 7. compliance_rules — enable RLS, public read (SEO/tool data)
-- ============================================================

ALTER TABLE IF EXISTS public.compliance_rules ENABLE ROW LEVEL SECURITY;

-- Jurisdiction data is intentionally public (powers the /map tool and SEO pages).
CREATE POLICY "public_read_compliance"
  ON public.compliance_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Modifications: service_role only.


-- ============================================================
-- 8. activity_logs — enable RLS, no direct client access
-- ============================================================

ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Internal operational log. Dashboard reads via service_role API.
-- No authenticated or anon policy: service_role only.


-- ============================================================
-- 9. audit_events and security_events
-- ============================================================
-- These tables were created with RLS in migration 001.
-- Policies are already applied there; no changes needed here.
-- Documented for completeness only.
--
-- audit_events:   service_role full access; authenticated insert-only
-- security_events: service_role full access only


-- ============================================================
-- STORAGE BUCKET ISOLATION
-- ============================================================
--
-- Three buckets exist:
--   evidence      — {deal_id}.pdf  — signed URLs (7-day), server-issued
--   documents     — {deal_id}/{timestamp}-{filename} — PUBLIC via getPublicUrl()
--   deal-documents — {deal_id}/{filename} — signed URLs (1h), server-issued
--
-- evidence + deal-documents: signed URL pattern is acceptable.
-- App layer (createAdminClient) controls URL issuance; no direct
-- bucket access needed for clients.
--
-- documents bucket: SECURITY GAP — currently public.
-- Any URL once obtained is permanently accessible regardless of RLS.
-- Supabase Storage RLS policies only restrict the API; CDN URLs bypass them.
-- Full remediation requires: set bucket to private, replace getPublicUrl()
-- with createSignedUrl() with short expiry, invalidate existing public URLs.
-- This is tracked as GAP-3 below and targeted at SECURITY-05.
--
-- Storage RLS policies (Supabase Storage uses INSERT/SELECT/UPDATE/DELETE
-- on the storage.objects virtual table):

-- Allow authenticated users to read files scoped to their own deals.
-- Path structure: {deal_id}/{rest}
-- We match on the first path component = a deal_id owned by the requesting user.

DROP POLICY IF EXISTS "client_read_own_evidence"    ON storage.objects;
DROP POLICY IF EXISTS "client_read_own_documents"   ON storage.objects;
DROP POLICY IF EXISTS "client_read_own_deal_documents" ON storage.objects;

CREATE POLICY "client_read_own_evidence"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.deals
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "client_read_own_documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.deals
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "client_read_own_deal_documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deal-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.deals
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Uploads (INSERT) on all buckets: operator/service_role only.
-- Anon: no storage access on any bucket.


-- ============================================================
-- SCHEMA GAPS — HONEST DISCLOSURE
-- ============================================================
--
-- GAP-1 (OPERATOR ISOLATION): deals.assignee is TEXT (a name or email
--   string), not a UUID FK to auth.users. Per-operator RLS is impossible
--   until a future migration adds deals.assignee_user_id UUID and
--   backfills it from auth.users. Until then, operator isolation is
--   enforced exclusively at the app layer via requireOperator().
--   Target: add deals.assignee_user_id in a future schema migration.
--
-- GAP-2 (NO TENANT_ID): No multi-tenancy column exists on any table.
--   If the platform ever serves multiple organizations, tenant isolation
--   will require schema changes. Not applicable to current single-operator
--   deployment.
--
-- GAP-3 (PUBLIC DOCUMENTS BUCKET): The 'documents' storage bucket issues
--   public CDN URLs via getPublicUrl(). Once a URL is in circulation it
--   cannot be revoked by RLS. Remediation: convert bucket to private,
--   switch all reads to createSignedUrl() with ≤15-minute expiry.
--   Target: SECURITY-05 (server-side matter/document permission guards).
--
-- GAP-4 (PLAINTEXT OTP): portal_otps.otp is stored as plaintext.
--   Should be replaced with a bcrypt or SHA-256 hash; app layer
--   compares hash at verification time. Target: future SECURITY-06.
--
-- GAP-5 (PAYMENTS FK INCONSISTENCY): payments.matter_id is TEXT but
--   the column semantically references deals.id (UUID). The RLS policy
--   above uses payer_email as the scope column because the FK join is
--   unreliable without a formal REFERENCES constraint. Target: normalize
--   payments.matter_id to UUID with a proper FK in a future migration.
-- ============================================================
