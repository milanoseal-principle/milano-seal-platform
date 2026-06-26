-- 035_discount_codes_FIXED.sql
-- discount_type enum: 'percentage', 'fixed_amount'
-- discount_status enum: 'ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED'

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.is_founder_or_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder', 'admin')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder', 'admin'),
    false
  );
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'discount_type') then
    create type public.discount_type as enum ('percentage', 'fixed_amount');
  end if;
  if not exists (select 1 from pg_type where typname = 'discount_status') then
    create type public.discount_status as enum ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED');
  end if;
end $$;

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.discount_type not null,
  discount_value numeric(12,2) not null,
  applies_to text not null default 'service_fee',
  client_id uuid null references auth.users(id) on delete set null,
  attorney_profile_id uuid null,
  matter_id uuid null,
  usage_limit integer null,
  usage_count integer not null default 0,
  expiration_date timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  approved_by uuid null references auth.users(id) on delete set null,
  internal_reason text not null,
  client_label text not null default 'Milano Seal courtesy adjustment',
  status public.discount_status not null default 'ACTIVE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_value_check check (
    (discount_type = 'percentage' and discount_value > 0 and discount_value <= 100)
    or (discount_type = 'fixed_amount' and discount_value > 0)
  )
);

create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete restrict,
  code text not null,
  matter_id uuid null,
  client_id uuid null references auth.users(id) on delete set null,
  invoice_id uuid null,
  original_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  final_amount numeric(12,2) not null default 0,
  redeemed_by uuid null references auth.users(id) on delete set null,
  approved_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_discount_assignments (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  client_id uuid null references auth.users(id) on delete cascade,
  attorney_profile_id uuid null,
  matter_id uuid null,
  assigned_by uuid null references auth.users(id) on delete set null,
  active boolean not null default true,
  note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.discount_audit_log (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid null references public.discount_codes(id) on delete set null,
  action text not null,
  actor_id uuid null references auth.users(id) on delete set null,
  matter_id uuid null,
  client_id uuid null references auth.users(id) on delete set null,
  internal_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_discount_codes_updated_at on public.discount_codes;
create trigger trg_discount_codes_updated_at
before update on public.discount_codes
for each row execute function public.set_updated_at();

create index if not exists idx_discount_codes_code on public.discount_codes(code);
create index if not exists idx_discount_codes_status on public.discount_codes(status);
create index if not exists idx_discount_codes_client_id on public.discount_codes(client_id);
create index if not exists idx_discount_redemptions_code_id on public.discount_redemptions(discount_code_id);
create index if not exists idx_discount_redemptions_matter_id on public.discount_redemptions(matter_id);
create index if not exists idx_client_discount_assignments_client_id on public.client_discount_assignments(client_id);
create index if not exists idx_discount_audit_log_code_id on public.discount_audit_log(discount_code_id);

alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;
alter table public.client_discount_assignments enable row level security;
alter table public.discount_audit_log enable row level security;

drop policy if exists "Founder and admin manage discount codes" on public.discount_codes;
create policy "Founder and admin manage discount codes"
on public.discount_codes for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());

drop policy if exists "Founder and admin manage discount redemptions" on public.discount_redemptions;
create policy "Founder and admin manage discount redemptions"
on public.discount_redemptions for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());

drop policy if exists "Founder and admin manage client discount assignments" on public.client_discount_assignments;
create policy "Founder and admin manage client discount assignments"
on public.client_discount_assignments for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());

drop policy if exists "Founder and admin manage discount audit log" on public.discount_audit_log;
create policy "Founder and admin manage discount audit log"
on public.discount_audit_log for all to authenticated
using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());
