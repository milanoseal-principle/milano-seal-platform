-- 043_complimentary_matter_authorizations.sql
-- Additive founder/operator-controlled complimentary Matter workflow.
-- This migration does not modify Wise webhook verification, Wise reconciliation,
-- custody ledger, release gate, or normal payment confirmation. It creates a
-- separate audited authorization path so a 100%-off Matter remains complimentary,
-- not paid, with verified revenue fixed at zero.

create extension if not exists pgcrypto;

create table if not exists public.complimentary_authorizations (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  quote_id text null,
  quote_version text not null,
  original_subtotal numeric(12,2) not null check (original_subtotal >= 0),
  original_add_ons numeric(12,2) not null check (original_add_ons >= 0),
  original_total numeric(12,2) not null check (original_total >= 0),
  discount_amount numeric(12,2) not null,
  final_amount_due numeric(12,2) not null default 0 check (final_amount_due = 0),
  currency text not null default 'USD',
  reason_code text not null check (reason_code in ('founder_authorized','family_and_friends','strategic_partner','pilot_matter','service_recovery','internal_quality_test','charitable','other')),
  reason_detail text not null check (length(trim(reason_detail)) >= 12),
  authorized_by_user_id uuid not null,
  authorized_by_role text not null,
  authorization_scope text not null default 'single_matter' check (authorization_scope = 'single_matter'),
  status text not null default 'active' check (status in ('active','revoked','consumed','superseded')),
  authorized_at timestamptz not null default now(),
  revoked_at timestamptz null,
  revoked_by_user_id uuid null,
  revocation_reason text null,
  consumed_at timestamptz null,
  audit_event_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint complimentary_full_adjustment check (discount_amount = original_total),
  constraint complimentary_zero_due check (final_amount_due = 0)
);

create unique index if not exists uniq_active_complimentary_authorization_per_matter
on public.complimentary_authorizations(matter_id)
where status = 'active';

create index if not exists idx_complimentary_authorizations_matter_id on public.complimentary_authorizations(matter_id);
create index if not exists idx_complimentary_authorizations_status on public.complimentary_authorizations(status);
create index if not exists idx_complimentary_authorizations_authorized_by on public.complimentary_authorizations(authorized_by_user_id);
create index if not exists idx_complimentary_authorizations_authorized_at on public.complimentary_authorizations(authorized_at desc);

alter table public.complimentary_authorizations enable row level security;

drop policy if exists "service_role_manages_complimentary_authorizations" on public.complimentary_authorizations;
create policy "service_role_manages_complimentary_authorizations"
on public.complimentary_authorizations for all to service_role
using (true) with check (true);

drop policy if exists "founder_reads_complimentary_authorizations" on public.complimentary_authorizations;
create policy "founder_reads_complimentary_authorizations"
on public.complimentary_authorizations for select to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin'));

alter table public.deals
  add column if not exists payment_disposition text not null default 'standard_payment' check (payment_disposition in ('standard_payment','complimentary','internal_test','written_off','refunded')),
  add column if not exists amount_before_adjustment numeric(12,2),
  add column if not exists complimentary_adjustment_amount numeric(12,2) not null default 0,
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists verified_revenue numeric(12,2) not null default 0,
  add column if not exists wise_payment_id text null,
  add column if not exists wise_transfer_id text null,
  add column if not exists comp_authorized boolean not null default false,
  add column if not exists comp_authorized_by uuid null,
  add column if not exists comp_authorized_at timestamptz null,
  add column if not exists comp_revoked_at timestamptz null,
  add column if not exists comp_reason_code text null,
  add column if not exists comp_reason_detail text null,
  add column if not exists comp_authorization_id uuid null;

create or replace function check_payment_gate()
returns trigger as $$
begin
  if NEW.deal_status in ('scheduled', 'in_execution', 'apostille', 'shipped', 'completed')
     and coalesce(OLD.deal_status, '') not in ('scheduled', 'in_execution', 'apostille', 'shipped', 'completed') then
    if NEW.payment_status in ('paid') then
      return NEW;
    end if;

    if NEW.payment_disposition = 'complimentary'
       and NEW.comp_authorized = true
       and NEW.comp_authorization_id is not null
       and NEW.comp_authorized_at is not null
       and NEW.comp_revoked_at is null
       and coalesce(NEW.amount_due, 0) = 0
       and coalesce(NEW.amount_paid, 0) = 0
       and coalesce(NEW.verified_revenue, 0) = 0
       and exists (
         select 1 from public.complimentary_authorizations ca
         where ca.id = NEW.comp_authorization_id
           and ca.matter_id = NEW.id
           and ca.status = 'active'
           and ca.final_amount_due = 0
           and ca.discount_amount = ca.original_total
       ) then
      return NEW;
    end if;

    raise exception 'PAYMENT_REQUIRED: matter cannot advance to % — verified payment or active complimentary authorization required', NEW.deal_status;
  end if;
  return NEW;
end;
$$ language plpgsql;

comment on table public.complimentary_authorizations is 'Append-only commercial disposition records for authorized complimentary Matters. These records do not represent paid revenue or Wise payment confirmation.';
