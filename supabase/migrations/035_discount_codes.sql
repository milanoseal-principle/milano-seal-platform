-- 035_discount_codes_FIXED.sql
-- Replay-safe canonical discount schema over the Milano OS compatibility tables.
-- This migration does not alter Wise payment authority or Matter execution gating.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.is_founder_or_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','superadmin')
    or (auth.jwt() -> 'user_metadata' ->> 'role') in ('founder','founder_admin','admin','admin_operator','superadmin'),
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

-- 031 may already have created discount_codes using legacy columns
-- (type/value/active/expires_at/max_uses/current_use_count/internal_note).
-- Add the canonical 035 fields and backfill them without dropping legacy data.
alter table public.discount_codes
  add column if not exists discount_type public.discount_type,
  add column if not exists discount_value numeric(12,2),
  add column if not exists applies_to text not null default 'service_fee',
  add column if not exists client_id uuid null references auth.users(id) on delete set null,
  add column if not exists attorney_profile_id uuid null,
  add column if not exists matter_id uuid null,
  add column if not exists usage_limit integer null,
  add column if not exists usage_count integer not null default 0,
  add column if not exists expiration_date timestamptz null,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists approved_by uuid null references auth.users(id) on delete set null,
  add column if not exists internal_reason text,
  add column if not exists client_label text not null default 'Milano Seal courtesy adjustment',
  add column if not exists status public.discount_status not null default 'ACTIVE',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Backfill only when the known legacy columns exist. Fresh databases created by
-- this migration alone already have canonical values and do not require this.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'discount_codes' and column_name = 'type'
  ) then
    execute $sql$
      update public.discount_codes
      set discount_type = coalesce(
            discount_type,
            case
              when lower(type::text) = 'percentage' then 'percentage'::public.discount_type
              when lower(type::text) in ('fixed','fixed_amount') then 'fixed_amount'::public.discount_type
              else null
            end
          ),
          discount_value = coalesce(discount_value, value),
          usage_limit = coalesce(usage_limit, max_uses),
          usage_count = greatest(coalesce(usage_count, 0), coalesce(current_use_count, 0)),
          expiration_date = coalesce(expiration_date, expires_at),
          internal_reason = coalesce(internal_reason, internal_note, 'Legacy governed discount record'),
          status = case
            when coalesce(active, true) = false then 'INACTIVE'::public.discount_status
            when expires_at is not null and expires_at <= now() then 'EXPIRED'::public.discount_status
            else coalesce(status, 'ACTIVE'::public.discount_status)
          end
    $sql$;
  end if;
end $$;

update public.discount_codes
set internal_reason = coalesce(nullif(trim(internal_reason), ''), 'Governed Milano Seal discount record')
where internal_reason is null or trim(internal_reason) = '';

alter table public.discount_codes
  alter column discount_type set not null,
  alter column discount_value set not null,
  alter column internal_reason set not null;

-- Add the value constraint only after legacy rows are normalized.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.discount_codes'::regclass
      and conname = 'discount_codes_value_check'
  ) then
    alter table public.discount_codes
      add constraint discount_codes_value_check check (
        (discount_type = 'percentage' and discount_value > 0 and discount_value <= 100)
        or (discount_type = 'fixed_amount' and discount_value > 0)
      );
  end if;
end $$;

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

-- 031 also creates a legacy discount_redemptions projection. Preserve those
-- rows and add only non-conflicting canonical fields. The legacy redeemed_by
-- text field is intentionally left untouched; later canonical reconciliation
-- owns actor normalization.
alter table public.discount_redemptions
  add column if not exists code text,
  add column if not exists invoice_id uuid null,
  add column if not exists original_amount numeric(12,2) not null default 0,
  add column if not exists final_amount numeric(12,2) not null default 0,
  add column if not exists approved_by uuid null references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'discount_redemptions' and column_name = 'original_total'
  ) then
    execute $sql$
      update public.discount_redemptions r
      set code = coalesce(r.code, dc.code),
          original_amount = case when r.original_amount = 0 then coalesce(r.original_total, 0) else r.original_amount end,
          final_amount = case when r.final_amount = 0 then coalesce(r.final_total, 0) else r.final_amount end,
          created_at = coalesce(r.created_at, r.redeemed_at, now())
      from public.discount_codes dc
      where dc.id = r.discount_code_id
    $sql$;
  else
    update public.discount_redemptions r
    set code = coalesce(r.code, dc.code)
    from public.discount_codes dc
    where dc.id = r.discount_code_id;
  end if;
end $$;

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
