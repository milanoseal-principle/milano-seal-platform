ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS discount_type text,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_reason text,
ADD COLUMN IF NOT EXISTS discount_note text,
ADD COLUMN IF NOT EXISTS discount_applied_by text,
ADD COLUMN IF NOT EXISTS discount_applied_at timestamptz,
ADD COLUMN IF NOT EXISTS founder_price_override numeric,
ADD COLUMN IF NOT EXISTS platform_fee_required numeric,
ADD COLUMN IF NOT EXISTS service_fee_waived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS price_override_locked boolean DEFAULT false;
