begin;
-- P1 Get Pricing: persist pricing requests on the SAME canonical sales_leads
-- table (lead_type = 'pricing_request'), reusing the existing idempotency,
-- rate-limit, matter-link and RLS contract. No new lead/CRM or Matter model is
-- introduced, and no lifecycle, payment, scheduling, pricing or storage policy
-- is changed here. sales_leads already enforces RLS with service-role-only
-- access (anon/authenticated revoked); this migration only adds an operator
-- pipeline index so pricing requests are efficiently listable.
create index if not exists sales_leads_pricing_request_created
  on public.sales_leads (created_at desc)
  where lead_type = 'pricing_request';

-- Operator "link to Matter" lookups for pricing requests reuse the existing
-- canonical_matter_id column; index unlinked requests for the pipeline view.
create index if not exists sales_leads_pricing_request_unlinked
  on public.sales_leads (created_at desc)
  where lead_type = 'pricing_request' and canonical_matter_id is null;
commit;
