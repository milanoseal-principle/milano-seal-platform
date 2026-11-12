-- Restore the application write/read contract on hosted tables.
--
-- Columns the application reads or writes, defined by repository migrations but absent from the
-- hosted tables (read-only P12 catalog, 2026-11-12). Without them PostgREST rejects the request:
-- portal email-code sign-in (portal_otps.deal_id), Wise webhook audit rows (idempotency_hash),
-- final release identifier checks, founder pricing override, lost-Matter capture, courier
-- details, receiving-authority management and Shippo tracking.
--
-- Additive: every column is nullable (hosted tables already hold rows). Idempotent and a no-op
-- on fresh replay. The only data statement copies receiving_authorities.name into the new,
-- empty authority_name column (reference data; nothing is overwritten).

alter table public.deals add column if not exists competitor_name text;
alter table public.deals add column if not exists courier_carrier text;
alter table public.deals add column if not exists courier_tracking_id text;
alter table public.deals add column if not exists discount_applied_at timestamptz;
alter table public.deals add column if not exists discount_applied_by text;
alter table public.deals add column if not exists discount_note text;
alter table public.deals add column if not exists discount_reason text;
alter table public.deals add column if not exists founder_price_override numeric;
alter table public.deals add column if not exists loss_reason text;
alter table public.deals add column if not exists lost_notes_internal text;
alter table public.deals add column if not exists lost_stage text;
alter table public.deals add column if not exists platform_fee_required numeric;
alter table public.deals add column if not exists price_override_locked boolean;
alter table public.deals add column if not exists referred_by text;
alter table public.deals add column if not exists repeat_client boolean;

alter table public.discount_redemptions add column if not exists original_amount numeric;

alter table public.identifier_locks add column if not exists identifier_type text;
alter table public.identifier_locks add column if not exists match_status text;

alter table public.matter_events add column if not exists actor_type text;

alter table public.portal_otps add column if not exists deal_id uuid;

alter table public.receiving_authorities add column if not exists authority_name text;
alter table public.receiving_authorities add column if not exists confidence_level text;
alter table public.receiving_authorities add column if not exists manual_review_required boolean;
alter table public.receiving_authorities add column if not exists routing_status text;
alter table public.receiving_authorities add column if not exists source_type text;
alter table public.receiving_authorities add column if not exists source_url text;
alter table public.receiving_authorities add column if not exists stale_after_days integer;
alter table public.receiving_authorities add column if not exists verified_by uuid;

alter table public.shippo_tracking_events add column if not exists action_required boolean;
alter table public.shippo_tracking_events add column if not exists status text;
alter table public.shippo_tracking_events add column if not exists substatus_code text;
alter table public.shippo_tracking_events add column if not exists substatus_text text;

alter table public.wise_webhook_events add column if not exists idempotency_hash text;

-- portal verify upserts with onConflict deal_id, which requires a unique index on deal_id.
do $$
begin
  if not exists (
    select 1 from pg_index i join pg_class t on t.oid = i.indrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'portal_otps' and i.indisunique
      and i.indkey::text = (select attnum::text from pg_attribute where attrelid = t.oid and attname = 'deal_id')
  ) then
    create unique index portal_otps_deal_id_uidx on public.portal_otps (deal_id);
  end if;
end
$$;

-- Hosted receiving_authorities stores the display name in name; the application reads authority_name.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'receiving_authorities' and column_name = 'name') then
    update public.receiving_authorities set authority_name = name where authority_name is null;
  end if;
end
$$;
