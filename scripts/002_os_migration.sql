-- Milano Seal OS Migration v2
-- Run in Supabase SQL Editor → SQL Editor → New Query

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS invoice_status           text DEFAULT 'proforma',
  ADD COLUMN IF NOT EXISTS invoice_subtotal         numeric,
  ADD COLUMN IF NOT EXISTS invoice_retainer         numeric,
  ADD COLUMN IF NOT EXISTS invoice_balance          numeric,
  ADD COLUMN IF NOT EXISTS invoice_valid_until      timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method           text DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS payment_reference        text,
  ADD COLUMN IF NOT EXISTS payment_amount_received  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compliance_result        text,
  ADD COLUMN IF NOT EXISTS decline_risk             text DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS follow_up_active         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS followup_schedule        text,
  ADD COLUMN IF NOT EXISTS execution_date           timestamptz,
  ADD COLUMN IF NOT EXISTS requires_apostille       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS destination_country      text,
  ADD COLUMN IF NOT EXISTS source                   text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS payment_link             text;

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_deals_payment_status ON public.deals(payment_status);
CREATE INDEX IF NOT EXISTS idx_deals_status_payment ON public.deals(status, payment_status);

SELECT 'OS Migration complete. Deals: ' || count(*) FROM public.deals;
