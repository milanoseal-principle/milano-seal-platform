-- 045_canonical_discount_system.sql
-- Canonical Milano Seal discount/courtesy architecture.
-- Live production truth on 2026-08-08: discount_codes and discount_redemptions
-- were absent. This migration also safely normalizes prior 034/035 shapes in
-- non-production environments so runtime code has ONE canonical contract.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- discount_codes — one canonical schema
-- ---------------------------------------------------------------------------
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null,
  discount_value numeric(12,2) not null,
  status text not null default 'inactive',
  usage_limit integer null,
  usage_count integer not null default 0,
  starts_at timestamptz null,
  expires_at timestamptz null,
  applies_to text not null default 'eligible_subtotal',
  client_id uuid null,
  attorney_profile_id uuid null,
  matter_id uuid null,
  created_by text null,
  updated_by text null,
  internal_reason text null,
  client_label text not null default 'Milano Seal courtesy adjustment',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalize the 034 shape if it exists in another environment.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='type')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='discount_type') then
    alter table public.discount_codes rename column type to discount_type;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='value')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='discount_value') then
    alter table public.discount_codes rename column value to discount_value;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='max_uses')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='usage_limit') then
    alter table public.discount_codes rename column max_uses to usage_limit;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='current_use_count')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='usage_count') then
    alter table public.discount_codes rename column current_use_count to usage_count;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='expiration_date')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='expires_at') then
    alter table public.discount_codes rename column expiration_date to expires_at;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='internal_note')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='internal_reason') then
    alter table public.discount_codes rename column internal_note to internal_reason;
  end if;
end $$;

alter table public.discount_codes
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(12,2),
  add column if not exists status text,
  add column if not exists usage_limit integer,
  add column if not exists usage_count integer default 0,
  add column if not exists starts_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists applies_to text default 'eligible_subtotal',
  add column if not exists client_id uuid,
  add column if not exists attorney_profile_id uuid,
  add column if not exists matter_id uuid,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists internal_reason text,
  add column if not exists client_label text default 'Milano Seal courtesy adjustment',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Convert enum-backed 035 columns to canonical lowercase text before checks.
alter table public.discount_codes alter column discount_type type text using lower(discount_type::text);
alter table public.discount_codes alter column status type text using lower(coalesce(status::text, 'inactive'));

-- If the legacy active boolean survived, use it once to populate canonical status.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_codes' and column_name='active') then
    execute 'update public.discount_codes set status = case when active then ''active'' else ''inactive'' end where status is null or status not in (''active'',''inactive'',''exhausted'',''expired'',''revoked'')';
    alter table public.discount_codes drop column active;
  end if;
end $$;

update public.discount_codes set code = upper(trim(code));
update public.discount_codes set status = 'inactive' where status is null;
update public.discount_codes set usage_count = 0 where usage_count is null;
update public.discount_codes set applies_to = 'eligible_subtotal' where applies_to is null or applies_to = 'service_fee';
update public.discount_codes set discount_type = 'percentage' where discount_type = 'percent';
update public.discount_codes set discount_type = 'fixed_amount' where discount_type in ('fixed','flat','flat_amount','courtesy');

alter table public.discount_codes
  alter column code set not null,
  alter column discount_type set not null,
  alter column discount_value set not null,
  alter column status set not null,
  alter column usage_count set not null,
  alter column applies_to set not null;

alter table public.discount_codes drop constraint if exists discount_codes_type_check;
alter table public.discount_codes drop constraint if exists discount_codes_value_check;
alter table public.discount_codes drop constraint if exists discount_codes_status_check;
alter table public.discount_codes drop constraint if exists discount_codes_usage_check;
alter table public.discount_codes drop constraint if exists discount_codes_applies_to_check;

alter table public.discount_codes
  add constraint discount_codes_type_check check (discount_type in ('percentage','fixed_amount')),
  add constraint discount_codes_value_check check (
    (discount_type='percentage' and discount_value > 0 and discount_value <= 100)
    or (discount_type='fixed_amount' and discount_value > 0)
  ),
  add constraint discount_codes_status_check check (status in ('inactive','active','exhausted','expired','revoked')),
  add constraint discount_codes_usage_check check (usage_count >= 0 and (usage_limit is null or (usage_limit >= 1 and usage_count <= usage_limit))),
  add constraint discount_codes_applies_to_check check (applies_to in ('eligible_subtotal','specific_line_items','matter_total'));

create unique index if not exists discount_codes_code_upper_uidx on public.discount_codes (upper(code));
create index if not exists discount_codes_status_idx on public.discount_codes(status);

-- ---------------------------------------------------------------------------
-- discount_redemptions — immutable payment-linked redemption ledger
-- ---------------------------------------------------------------------------
create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete restrict,
  matter_id uuid not null,
  client_id uuid null,
  payment_reference text null,
  wise_transaction_reference text null,
  eligible_subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'reserved',
  reserved_at timestamptz null,
  redeemed_at timestamptz null,
  released_at timestamptz null,
  voided_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  metadata jsonb not null default '{}'::jsonb
);

-- Normalize previous redemption shapes without preserving runtime dual schemas.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_redemptions' and column_name='original_total')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_redemptions' and column_name='eligible_subtotal') then
    alter table public.discount_redemptions rename column original_total to eligible_subtotal;
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_redemptions' and column_name='original_amount')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='discount_redemptions' and column_name='eligible_subtotal') then
    alter table public.discount_redemptions rename column original_amount to eligible_subtotal;
  end if;
end $$;

alter table public.discount_redemptions
  add column if not exists matter_id uuid,
  add column if not exists client_id uuid,
  add column if not exists payment_reference text,
  add column if not exists wise_transaction_reference text,
  add column if not exists eligible_subtotal numeric(12,2) default 0,
  add column if not exists discount_amount numeric(12,2) default 0,
  add column if not exists currency text default 'USD',
  add column if not exists status text default 'reserved',
  add column if not exists reserved_at timestamptz,
  add column if not exists redeemed_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists voided_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists created_by text,
  add column if not exists metadata jsonb default '{}'::jsonb;

update public.discount_redemptions
set status = case when redeemed_at is not null then 'redeemed' else coalesce(status, 'reserved') end;
update public.discount_redemptions set currency='USD' where currency is null;

alter table public.discount_redemptions drop constraint if exists discount_redemptions_status_check;
alter table public.discount_redemptions
  add constraint discount_redemptions_status_check check (status in ('reserved','redeemed','released','voided','failed'));

create unique index if not exists discount_redemptions_code_matter_redeemed_uidx
  on public.discount_redemptions(discount_code_id, matter_id)
  where status='redeemed';
create index if not exists discount_redemptions_matter_idx on public.discount_redemptions(matter_id);

-- ---------------------------------------------------------------------------
-- Atomic redemption. Applying/entering a code NEVER consumes it. Only a
-- confirmed, reconciled Wise payment may call this function from trusted server
-- code. Row locking prevents concurrent redemption of a single-use code.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_discount_for_matter(
  p_discount_code_id uuid,
  p_matter_id uuid,
  p_payment_reference text,
  p_wise_transaction_reference text,
  p_currency text,
  p_created_by text default 'wise-webhook'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.discount_codes%rowtype;
  v_matter public.matters%rowtype;
  v_existing uuid;
  v_redemption uuid;
begin
  select id into v_existing
  from public.discount_redemptions
  where discount_code_id=p_discount_code_id and matter_id=p_matter_id and status='redeemed'
  limit 1;
  if v_existing is not null then return v_existing; end if;

  select * into v_code from public.discount_codes where id=p_discount_code_id for update;
  if not found then raise exception 'discount_code_not_found'; end if;
  if v_code.status <> 'active' then raise exception 'discount_code_not_active'; end if;
  if v_code.starts_at is not null and v_code.starts_at > now() then raise exception 'discount_code_not_started'; end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then raise exception 'discount_code_expired'; end if;
  if v_code.usage_limit is not null and v_code.usage_count >= v_code.usage_limit then raise exception 'discount_code_exhausted'; end if;

  select * into v_matter from public.matters where id=p_matter_id for update;
  if not found then raise exception 'matter_not_found'; end if;
  if upper(coalesce(v_matter.discount_code,'')) <> upper(v_code.code) then raise exception 'discount_not_attached_to_matter'; end if;

  insert into public.discount_redemptions(
    discount_code_id,matter_id,client_id,payment_reference,wise_transaction_reference,
    eligible_subtotal,discount_amount,currency,status,redeemed_at,created_by,metadata
  ) values (
    v_code.id,v_matter.id,v_matter.client_id,p_payment_reference,p_wise_transaction_reference,
    coalesce(v_matter.original_total,0),coalesce(v_matter.discount_amount,0),upper(coalesce(p_currency,'USD')),
    'redeemed',now(),p_created_by,jsonb_build_object('source','confirmed_wise_reconciliation')
  ) returning id into v_redemption;

  update public.discount_codes
  set usage_count=usage_count+1,
      status=case when usage_limit is not null and usage_count+1 >= usage_limit then 'exhausted' else status end,
      updated_at=now()
  where id=v_code.id;

  return v_redemption;
end;
$$;

revoke all on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) from public;
revoke all on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) from anon;
revoke all on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) from authenticated;
grant execute on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) to service_role;

-- Founder/admin control. Browser clients may not directly mutate discount tables.
alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;

drop policy if exists "Founder and admin manage discount codes" on public.discount_codes;
create policy "Founder and admin manage discount codes" on public.discount_codes
for all to authenticated
using (coalesce((auth.jwt()->'app_metadata'->>'role') in ('founder','founder_admin','admin','admin_operator'), false))
with check (coalesce((auth.jwt()->'app_metadata'->>'role') in ('founder','founder_admin','admin','admin_operator'), false));

drop policy if exists "Founder and admin read discount redemptions" on public.discount_redemptions;
create policy "Founder and admin read discount redemptions" on public.discount_redemptions
for select to authenticated
using (coalesce((auth.jwt()->'app_metadata'->>'role') in ('founder','founder_admin','admin','admin_operator','finance','finance_operator'), false));
