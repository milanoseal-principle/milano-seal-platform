begin;
-- Complete the existing /api/sales/capture persistence contract, rather than
-- introduce another lead/CRM or Matter model. Never grants public read/write.
create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text, email text not null, phone text, audience text, country text,
  document_type text, industry text, product_interest text, urgency text,
  source_route text, desired_next_step text, lead_type text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.sales_leads add column if not exists ip_hash text;
alter table public.sales_leads add column if not exists canonical_matter_id uuid references public.deals(id);
alter table public.sales_leads add column if not exists linked_by uuid;
alter table public.sales_leads add column if not exists linked_at timestamptz;
alter table public.sales_leads enable row level security;
revoke all on public.sales_leads from anon, authenticated;
grant all on public.sales_leads to service_role;
drop policy if exists service_role_sales_leads on public.sales_leads;
create policy service_role_sales_leads on public.sales_leads for all to service_role using (true) with check (true);
create index if not exists sales_leads_counsel_created on public.sales_leads (created_at desc) where lead_type = 'counsel_inquiry';
create index if not exists sales_leads_ip_created on public.sales_leads (ip_hash, created_at);
-- Existing private bucket and service-role server transport only. No public
-- bucket or storage policy is added. 'counsel/' does not match any Matter UUID.
commit;
