-- ============================================================
-- Migration 020: Alliance Portal Phase 2 Extended Tables
-- Replay-safe over legacy revenue/commission tables.
-- ============================================================

-- partner_messages
CREATE TABLE IF NOT EXISTS public.partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  from_role text NOT NULL CHECK (from_role IN ('partner', 'milano_seal')),
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- partner_commissions
-- A legacy revenue table may already exist with partner_id TEXT. Do not coerce
-- or overwrite that historical identifier. Portal ownership is linked through
-- alliance_partner_id UUID so the two identity domains remain explicit.
CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id text,
  alliance_partner_id uuid REFERENCES public.alliance_partners(id),
  referral_id uuid REFERENCES public.referral_ledger(id),
  matter_ref text,
  period text,
  status text NOT NULL DEFAULT 'NOT_ELIGIBLE'
    CHECK (status IN ('NOT_ELIGIBLE','PENDING_REVIEW','APPROVED','REJECTED','PAID','ON_HOLD','NEEDS_REVIEW')),
  amount numeric(10,2),
  notes text,
  reviewed_by text,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS alliance_partner_id uuid REFERENCES public.alliance_partners(id),
  ADD COLUMN IF NOT EXISTS referral_id uuid REFERENCES public.referral_ledger(id),
  ADD COLUMN IF NOT EXISTS matter_ref text,
  ADD COLUMN IF NOT EXISTS period text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'NOT_ELIGIBLE',
  ADD COLUMN IF NOT EXISTS amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Existing legacy rows remain unlinked until an operator can prove the partner
-- identity. Never infer a UUID relationship from an arbitrary historical text
-- partner_id. New portal rows use alliance_partner_id.
CREATE INDEX IF NOT EXISTS idx_partner_commissions_alliance_partner
  ON public.partner_commissions(alliance_partner_id);

-- Keep the portal status domain explicit without modifying legacy
-- commission_status or payout fields.
ALTER TABLE public.partner_commissions
  DROP CONSTRAINT IF EXISTS partner_commissions_portal_status_check;
ALTER TABLE public.partner_commissions
  ADD CONSTRAINT partner_commissions_portal_status_check CHECK (
    status IS NULL OR status IN ('NOT_ELIGIBLE','PENDING_REVIEW','APPROVED','REJECTED','PAID','ON_HOLD','NEEDS_REVIEW')
  );

-- partner_document_shares
CREATE TABLE IF NOT EXISTS public.partner_document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  document_name text NOT NULL,
  document_type text,
  storage_path text,
  download_url text,
  shared_by text,
  shared_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- partner_notes
CREATE TABLE IF NOT EXISTS public.partner_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  note_type text DEFAULT 'relationship',
  content text NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- partner_access_logs
CREATE TABLE IF NOT EXISTS public.partner_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  action text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- partner_corridors (partner jurisdiction capabilities)
CREATE TABLE IF NOT EXISTS public.partner_corridors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  country_code text NOT NULL,
  document_types text[] DEFAULT '{}',
  verified boolean DEFAULT false,
  verified_at timestamptz,
  UNIQUE(partner_id, country_code)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.partner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_corridors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_messages_read" ON public.partner_messages;
CREATE POLICY "partner_messages_read" ON public.partner_messages
  FOR SELECT USING (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "partner_messages_insert" ON public.partner_messages;
CREATE POLICY "partner_messages_insert" ON public.partner_messages
  FOR INSERT WITH CHECK (
    partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid())
    AND from_role = 'partner'
  );

DROP POLICY IF EXISTS "partner_commissions_read" ON public.partner_commissions;
CREATE POLICY "partner_commissions_read" ON public.partner_commissions
  FOR SELECT USING (
    alliance_partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "partner_document_shares_read" ON public.partner_document_shares;
CREATE POLICY "partner_document_shares_read" ON public.partner_document_shares
  FOR SELECT USING (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "partner_corridors_read" ON public.partner_corridors;
CREATE POLICY "partner_corridors_read" ON public.partner_corridors
  FOR SELECT USING (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));

-- partner_notes and access_logs: operator only — no partner RLS read policy intentionally omitted
