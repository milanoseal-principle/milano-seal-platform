begin;

-- 048_production_discount_schema_reconciliation.sql
-- Production reconciliation for legacy discount tables discovered during the
-- DAMIANI50 / TIFFTEST50 launch gate. Schema-only: no operational courtesy code
-- is created, activated, consumed, reset, or deleted here.

-- ---------------------------------------------------------------------------
-- discount_codes: normalize legacy enum-backed fields to the runtime contract.
-- Preserve legacy UUID audit actor columns; runtime actor evidence lives in
-- metadata so this migration does not break existing UUID/FK history.
-- ---------------------------------------------------------------------------
alter table public.discount_codes
  add column if not exists starts_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists usage_limit integer,
  add column if not exists usage_count integer default 0,
  add column if not exists applies_to text default 'eligible_subtotal',
  add column if not exists internal_reason text,
  add column if not exists client_label text default 'Milano Seal courtesy adjustment',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid='public.discount_codes'::regclass
      and contype='c'
      and (
        pg_get_constraintdef(oid) ilike '%discount_type%'
        or pg_get_constraintdef(oid) ilike '%status%'
        or pg_get_constraintdef(oid) ilike '%applies_to%'
      )
  loop
    execute format('alter table public.discount_codes drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.discount_codes alter column discount_type drop default;
alter table public.discount_codes alter column status drop default;

alter table public.discount_codes
  alter column discount_type type text using lower(discount_type::text),
  alter column status type text using lower(status::text);

update public.discount_codes set code=upper(trim(code)) where code is not null;
update public.discount_codes set discount_type='percentage' where discount_type in ('percent','percentage');
update public.discount_codes set discount_type='fixed_amount' where discount_type in ('fixed','flat','flat_amount','courtesy','fixed_amount');
update public.discount_codes set status='inactive' where status is null or trim(status)='';
update public.discount_codes set usage_count=0 where usage_count is null;
update public.discount_codes set applies_to=lower(trim(applies_to)) where applies_to is not null;
update public.discount_codes set applies_to='eligible_subtotal' where applies_to is null or applies_to='service_fee';
update public.discount_codes set applies_to='specific_line_items' where applies_to='apostille';
update public.discount_codes set metadata='{}'::jsonb where metadata is null;

-- Fail closed rather than silently remap unknown production values.
do $$
begin
  if exists (
    select 1 from public.discount_codes
    where discount_type not in ('percentage','fixed_amount')
       or status not in ('inactive','active','exhausted','expired','revoked')
       or applies_to not in ('eligible_subtotal','specific_line_items','matter_total')
  ) then
    raise exception 'discount_codes_contains_unmapped_legacy_values';
  end if;
end $$;

alter table public.discount_codes
  alter column status set default 'inactive',
  alter column usage_count set default 0,
  alter column applies_to set default 'eligible_subtotal',
  alter column metadata set default '{}'::jsonb;

alter table public.discount_codes
  drop constraint if exists discount_codes_type_check,
  drop constraint if exists discount_codes_value_check,
  drop constraint if exists discount_codes_status_check,
  drop constraint if exists discount_codes_usage_check,
  drop constraint if exists discount_codes_applies_to_check;

alter table public.discount_codes
  add constraint discount_codes_type_check check (discount_type in ('percentage','fixed_amount')),
  add constraint discount_codes_value_check check (
    (discount_type='percentage' and discount_value > 0 and discount_value <= 100)
    or (discount_type='fixed_amount' and discount_value > 0)
  ),
  add constraint discount_codes_status_check check (status in ('inactive','active','exhausted','expired','revoked')),
  add constraint discount_codes_usage_check check (
    usage_count >= 0 and (usage_limit is null or (usage_limit >= 1 and usage_count <= usage_limit))
  ),
  add constraint discount_codes_applies_to_check check (
    applies_to in ('eligible_subtotal','specific_line_items','matter_total')
  );

create unique index if not exists discount_codes_code_upper_uidx on public.discount_codes(upper(code));
create index if not exists discount_codes_status_idx on public.discount_codes(status);

-- ---------------------------------------------------------------------------
-- discount_redemptions: complete the immutable Wise-linked ledger contract.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='discount_redemptions' and column_name='original_amount'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='discount_redemptions' and column_name='eligible_subtotal'
  ) then
    alter table public.discount_redemptions rename column original_amount to eligible_subtotal;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='discount_redemptions' and column_name='original_total'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='discount_redemptions' and column_name='eligible_subtotal'
  ) then
    alter table public.discount_redemptions rename column original_total to eligible_subtotal;
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
  add column if not exists status text,
  add column if not exists reserved_at timestamptz,
  add column if not exists redeemed_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists voided_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists metadata jsonb default '{}'::jsonb;

do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid='public.discount_redemptions'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.discount_redemptions drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.discount_redemptions alter column status drop default;
alter table public.discount_redemptions alter column status type text using lower(status::text);

update public.discount_redemptions set status='redeemed' where redeemed_at is not null;
update public.discount_redemptions set status='reserved' where status is null or trim(status)='';
update public.discount_redemptions set currency='USD' where currency is null or trim(currency)='';
update public.discount_redemptions set metadata='{}'::jsonb where metadata is null;

do $$
begin
  if exists (
    select 1 from public.discount_redemptions
    where status not in ('reserved','redeemed','released','voided','failed')
  ) then
    raise exception 'discount_redemptions_contains_unmapped_legacy_status';
  end if;
end $$;

alter table public.discount_redemptions
  alter column status set default 'reserved',
  alter column metadata set default '{}'::jsonb;

alter table public.discount_redemptions drop constraint if exists discount_redemptions_status_check;
alter table public.discount_redemptions
  add constraint discount_redemptions_status_check check (status in ('reserved','redeemed','released','voided','failed'));

create unique index if not exists discount_redemptions_code_matter_redeemed_uidx
  on public.discount_redemptions(discount_code_id,matter_id)
  where status='redeemed';
create index if not exists discount_redemptions_matter_idx on public.discount_redemptions(matter_id);

-- ---------------------------------------------------------------------------
-- deals: guarantee every column referenced by intake + atomic Wise redemption.
-- ---------------------------------------------------------------------------
alter table public.deals
  add column if not exists discount_code text,
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(12,2),
  add column if not exists discount_amount numeric(12,2) default 0,
  add column if not exists eligible_subtotal numeric(12,2),
  add column if not exists non_discountable_total numeric(12,2) not null default 0,
  add column if not exists original_total numeric(12,2),
  add column if not exists final_total numeric(12,2),
  add column if not exists wise_transaction_reference text;

create index if not exists idx_deals_discount_code on public.deals(upper(discount_code));
create index if not exists idx_deals_wise_reference on public.deals(wise_reference);

-- ---------------------------------------------------------------------------
-- Atomic redemption: actor is recorded in metadata. We intentionally do not
-- write discount_redemptions.created_by because legacy production may retain a
-- UUID-backed audit actor column.
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
set search_path=public
as $$
declare
  v_code public.discount_codes%rowtype;
  v_deal public.deals%rowtype;
  v_existing uuid;
  v_redemption uuid;
begin
  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency';
  end if;

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

  select * into v_deal from public.deals where id=p_matter_id for update;
  if not found then raise exception 'matter_not_found'; end if;
  if upper(coalesce(v_deal.discount_code,'')) <> upper(v_code.code) then raise exception 'discount_not_attached_to_matter'; end if;
  if v_deal.eligible_subtotal is null then raise exception 'eligible_subtotal_missing'; end if;

  insert into public.discount_redemptions(
    discount_code_id,matter_id,client_id,payment_reference,wise_transaction_reference,
    eligible_subtotal,discount_amount,currency,status,redeemed_at,metadata
  ) values (
    v_code.id,v_deal.id,null,p_payment_reference,p_wise_transaction_reference,
    v_deal.eligible_subtotal,coalesce(v_deal.discount_amount,0),upper(trim(p_currency)),
    'redeemed',now(),jsonb_build_object(
      'source','confirmed_wise_reconciliation',
      'actor',coalesce(nullif(trim(p_created_by),''),'wise-webhook')
    )
  ) returning id into v_redemption;

  update public.discount_codes
  set usage_count=usage_count+1,
      status=case when usage_limit is not null and usage_count+1>=usage_limit then 'exhausted' else status end,
      updated_at=now()
  where id=v_code.id;

  return v_redemption;
end;
$$;

revoke all on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.redeem_discount_for_matter(uuid,uuid,text,text,text,text) to service_role;

create or replace function public.confirm_wise_payment_for_deal(
  p_deal_id uuid,
  p_payment_reference text,
  p_wise_transaction_reference text,
  p_amount numeric,
  p_currency text,
  p_actor text default 'wise-webhook'
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_deal public.deals%rowtype;
  v_discount_id uuid;
  v_redemption_id uuid;
  v_expected_currency text;
begin
  if p_amount is null or p_amount<=0 then raise exception 'invalid_payment_amount'; end if;
  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then raise exception 'invalid_payment_currency'; end if;

  select * into v_deal from public.deals where id=p_deal_id for update;
  if not found then raise exception 'matter_not_found'; end if;

  if v_deal.payment_status='paid' and v_deal.payment_confirmed=true then
    return jsonb_build_object('confirmed',true,'already_confirmed',true,'redemption_id',null);
  end if;

  if v_deal.amount_due is null or v_deal.amount_due<=0 then raise exception 'amount_due_missing'; end if;
  if round(p_amount*100) <> round(v_deal.amount_due*100) then raise exception 'payment_amount_mismatch'; end if;

  v_expected_currency:=upper(coalesce(nullif(trim(v_deal.currency),''),'USD'));
  if upper(trim(p_currency)) <> v_expected_currency then raise exception 'payment_currency_mismatch'; end if;
  if p_payment_reference is null or trim(p_payment_reference)='' then raise exception 'payment_reference_missing'; end if;
  if coalesce(v_deal.wise_reference,v_deal.deal_id) <> trim(p_payment_reference) then raise exception 'payment_reference_mismatch'; end if;

  if nullif(trim(coalesce(v_deal.discount_code,'')),'') is not null then
    select id into v_discount_id
    from public.discount_codes
    where upper(code)=upper(v_deal.discount_code)
    limit 1;
    if v_discount_id is null then raise exception 'attached_discount_not_found'; end if;

    v_redemption_id:=public.redeem_discount_for_matter(
      v_discount_id,v_deal.id,trim(p_payment_reference),p_wise_transaction_reference,
      upper(trim(p_currency)),p_actor
    );
  end if;

  update public.deals
  set payment_status='paid',
      payment_confirmed=true,
      payment_method='wise',
      payment_reference=trim(p_payment_reference),
      wise_transaction_reference=p_wise_transaction_reference,
      payment_amount_received=p_amount,
      amount_paid=p_amount,
      payment_confirmed_at=now(),
      payment_settlement_status='cleared',
      payment_cleared_at=now(),
      payment_funding_method='wise',
      updated_at=now()
  where id=v_deal.id;

  return jsonb_build_object('confirmed',true,'already_confirmed',false,'redemption_id',v_redemption_id);
end;
$$;

revoke all on function public.confirm_wise_payment_for_deal(uuid,text,text,numeric,text,text) from public,anon,authenticated;
grant execute on function public.confirm_wise_payment_for_deal(uuid,text,text,numeric,text,text) to service_role;

-- RLS remains enabled and browser mutation remains founder/admin-controlled.
alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;

commit;
