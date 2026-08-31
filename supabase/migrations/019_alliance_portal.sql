-- ============================================================
-- 019_alliance_portal.sql — B2B Alliance Partner Portal
-- Replay-safe reconciliation over migration 011.
-- ============================================================

-- alliance_partners
CREATE TABLE IF NOT EXISTS public.alliance_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  partner_code text UNIQUE NOT NULL,
  firm_name text,
  contact_name text,
  email text NOT NULL,
  partner_type text,
  status text NOT NULL DEFAULT 'invited',
  toolbelt_completed boolean DEFAULT false,
  compliance_verified boolean DEFAULT false,
  security_attested boolean DEFAULT false,
  routing_eligible boolean DEFAULT false,
  jurisdiction_codes text[] DEFAULT '{}',
  document_categories text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migration 011 may already have created alliance_partners with the legacy
-- tracking schema. Converge that table to the portal schema before any RLS
-- policy references portal-only columns. Preserve legacy fields/data.
ALTER TABLE public.alliance_partners
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS partner_code text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS partner_type text,
  ADD COLUMN IF NOT EXISTS toolbelt_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS compliance_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_attested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS routing_eligible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS jurisdiction_codes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_categories text[] DEFAULT '{}';

-- Existing legacy rows need a stable internal partner code before the portal
-- invariant can be enforced. This derives only from the row UUID and creates no
-- competing business identity or Matter authority.
UPDATE public.alliance_partners
SET partner_code = 'AP-' || upper(substr(replace(id::text, '-', ''), 1, 12))
WHERE partner_code IS NULL OR btrim(partner_code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_alliance_partners_partner_code
  ON public.alliance_partners(partner_code);

ALTER TABLE public.alliance_partners
  ALTER COLUMN partner_code SET NOT NULL;

-- Migration 011 installed a narrower legacy status constraint. Replace only
-- that column constraint with the union required by the current Alliance
-- lifecycle so old rows remain valid while portal states become usable.
ALTER TABLE public.alliance_partners
  DROP CONSTRAINT IF EXISTS alliance_partners_status_check;

ALTER TABLE public.alliance_partners
  ADD CONSTRAINT alliance_partners_status_check CHECK (
    status IN (
      'pending','invited','profile_started','identity_pending','profile_completed',
      'toolbelt_started','toolbelt_completed','compliance_pending','compliance_verified',
      'security_attested','routing_eligible','active','paused','suspended','offboarded','terminated'
    )
  );

-- referral_ledger
CREATE TABLE IF NOT EXISTS public.referral_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  deal_id uuid REFERENCES public.deals(id),
  partner_reference text,
  client_name text,
  destination_country text,
  document_type text,
  matter_type text,
  urgency text,
  notes text,
  referral_status text NOT NULL DEFAULT 'submitted'
    CHECK (referral_status IN ('submitted','under_review','accepted','rejected','in_progress','completed')),
  commission_status text NOT NULL DEFAULT 'NOT_ELIGIBLE'
    CHECK (commission_status IN ('NOT_ELIGIBLE','PENDING_REVIEW','APPROVED','REJECTED','PAID','ON_HOLD','NEEDS_REVIEW')),
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- partner_intake_links
CREATE TABLE IF NOT EXISTS public.partner_intake_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  partner_code text NOT NULL,
  campaign_label text,
  destination_country text,
  document_type text,
  click_count integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- partner_toolbelt_progress
CREATE TABLE IF NOT EXISTS public.partner_toolbelt_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.alliance_partners(id),
  module_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','submitted','approved','rejected','expired','review_required')),
  completed_at timestamptz,
  reviewed_by text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, module_key)
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.alliance_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_intake_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_toolbelt_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alliance_partners_self_read" ON public.alliance_partners;
CREATE POLICY "alliance_partners_self_read" ON public.alliance_partners
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "referral_ledger_partner_read" ON public.referral_ledger;
CREATE POLICY "referral_ledger_partner_read" ON public.referral_ledger
  FOR SELECT USING (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "referral_ledger_partner_insert" ON public.referral_ledger;
CREATE POLICY "referral_ledger_partner_insert" ON public.referral_ledger
  FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "intake_links_partner_read" ON public.partner_intake_links;
CREATE POLICY "intake_links_partner_read" ON public.partner_intake_links
  FOR SELECT USING (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "toolbelt_progress_partner_read" ON public.partner_toolbelt_progress;
CREATE POLICY "toolbelt_progress_partner_read" ON public.partner_toolbelt_progress
  FOR SELECT USING (partner_id IN (SELECT id FROM public.alliance_partners WHERE user_id = auth.uid()));
