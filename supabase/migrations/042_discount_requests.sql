-- 042_discount_requests.sql
-- ADDITIVE ONLY. Adds the partner/alliance discount REQUEST intake + operator
-- approval workflow that the existing discount engine (034/035 + discountService)
-- did not have. Creates ONE new table. Does NOT alter discount_codes,
-- discount_redemptions, matters, payment status, or the release gate.
--
-- Comp / 100% payment-clear + paid_comped are intentionally NOT handled here:
-- the live discount_codes column shape differs between migration 034 (type/value)
-- and 035 (discount_type/discount_value), so any ALTER or payment_status write
-- must be confirmed against the production schema first. See
-- docs/audits/DISCOUNT_ENGINE_GAP_ANALYSIS.md.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'discount_request_status') then
    create type public.discount_request_status as enum ('pending', 'approved', 'denied', 'cancelled');
  end if;
end $$;

create table if not exists public.discount_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by text null,
  requested_by_role text null,
  partner_id text null,
  matter_id text null,
  client_email text null,
  requested_code text null,
  -- 'percent' | 'fixed' | 'comp'. Text (not the existing enum) so this table is
  -- independent of the discount_codes shape ambiguity.
  discount_type text not null check (discount_type in ('percent', 'fixed', 'comp')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  reason text null,
  status public.discount_request_status not null default 'pending',
  reviewed_by text null,
  reviewed_at timestamptz null,
  review_note text null,
  -- Set true only when an operator/owner approves a comp (100%) request. This is
  -- an approval RECORD only; it does not itself clear payment.
  comp_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_discount_requests_status on public.discount_requests(status);
create index if not exists idx_discount_requests_matter_id on public.discount_requests(matter_id);
create index if not exists idx_discount_requests_partner_id on public.discount_requests(partner_id);

alter table public.discount_requests enable row level security;

-- Service role (server routes using the admin client) has full access.
-- No anonymous / client-side direct writes.
drop policy if exists "Service role manages discount requests" on public.discount_requests;
create policy "Service role manages discount requests"
on public.discount_requests for all to service_role
using (true) with check (true);

-- Founder/admin may read/manage from an authenticated session (parity with 035).
drop policy if exists "Founder and admin manage discount requests" on public.discount_requests;
create policy "Founder and admin manage discount requests"
on public.discount_requests for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());
