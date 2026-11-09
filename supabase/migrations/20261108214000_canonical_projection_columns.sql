begin;
-- These existing canonical application fields were referenced by P3 quote and
-- portal/courier code but absent from the historical migration chain.
-- Unknown address/tier stays NULL; no hosted legacy values are overwritten.
alter table public.deals add column if not exists ship_to jsonb,
 add column if not exists execution_tier text,
 add column if not exists invoice_subtotal numeric(12,2),
 add column if not exists signed_by text,
 add column if not exists evidence_url text,
 add column if not exists evidence_generated_at timestamptz;
alter table public.deals add constraint deals_ship_to_object check(ship_to is null or jsonb_typeof(ship_to)='object') not valid;
commit;
