-- Replace hosted RLS policies that gave EVERY signed-in account unrestricted access.
--
-- Evidence: read-only P12 catalog of project ehqdzfopsrbwewtddiwq, observed
-- 2026-11-14T16:13:18Z. Each policy below targets the authenticated role with an expression
-- whose md5 equals md5('true'), and authenticated holds table privileges on every table, so any
-- signed-in client, alliance partner or notary account could read (and for liaison intake, insert
-- and rewrite) every row through the Data API:
--
--   liaison_intake_records  liaison_intake_authenticated_select   SELECT  USING true
--   liaison_intake_records  liaison_intake_authenticated_insert   INSERT  CHECK true
--   liaison_intake_records  liaison_intake_authenticated_update   UPDATE  USING true CHECK true
--   referral_ledger         operator_read_referral_ledger         SELECT  USING true
--   payout_reviews          operator_read_payout_reviews          SELECT  USING true
--   partner_scorecards      operator_read_partner_scorecards      SELECT  USING true
--   translation_entries     "authenticated translation reviewers can read entries"  SELECT  USING true
--
-- Replacement (least privilege, server-issued identity only):
--   * staff access uses public.is_operator(), which reads auth.users.raw_app_meta_data (never the
--     client-editable user_metadata) and refuses disabled or banned accounts;
--   * an active alliance account may read only the referral_ledger rows attributed to its own
--     operators row (partner_id), which the alliance portal pages read with the session client;
--   * payout reviews, scorecards, translation entries and liaison intake become operator-only.
-- The application writes every one of these tables with the service-role client, which bypasses
-- RLS, so no server path loses access. Anonymous table privileges are revoked as defence in depth
-- (no anon policy exists, so this changes no behaviour). Nothing is deleted or rewritten.
--
-- Forward-only and idempotent. liaison_intake_records exists only in the hosted database, so
-- every table is checked with to_regclass; on a fresh replay absent tables are skipped.

do $$
begin
  if to_regclass('public.liaison_intake_records') is not null then
    drop policy if exists liaison_intake_authenticated_select on public.liaison_intake_records;
    drop policy if exists liaison_intake_authenticated_insert on public.liaison_intake_records;
    drop policy if exists liaison_intake_authenticated_update on public.liaison_intake_records;
    drop policy if exists liaison_intake_operator_select on public.liaison_intake_records;
    drop policy if exists liaison_intake_operator_insert on public.liaison_intake_records;
    drop policy if exists liaison_intake_operator_update on public.liaison_intake_records;
    alter table public.liaison_intake_records enable row level security;
    create policy liaison_intake_operator_select on public.liaison_intake_records
      for select to authenticated using (public.is_operator());
    create policy liaison_intake_operator_insert on public.liaison_intake_records
      for insert to authenticated with check (public.is_operator());
    create policy liaison_intake_operator_update on public.liaison_intake_records
      for update to authenticated using (public.is_operator()) with check (public.is_operator());
    revoke all on public.liaison_intake_records from anon;
    revoke delete, truncate, references, trigger on public.liaison_intake_records from authenticated;
  end if;

  if to_regclass('public.referral_ledger') is not null then
    drop policy if exists operator_read_referral_ledger on public.referral_ledger;
    drop policy if exists referral_ledger_operator_read on public.referral_ledger;
    drop policy if exists referral_ledger_partner_read_own on public.referral_ledger;
    alter table public.referral_ledger enable row level security;
    create policy referral_ledger_operator_read on public.referral_ledger
      for select to authenticated using (public.is_operator());
    create policy referral_ledger_partner_read_own on public.referral_ledger
      for select to authenticated using (
        partner_id is not null and exists (
          select 1 from public.operators o
          where o.id = referral_ledger.partner_id
            and o.user_id = auth.uid()
            and coalesce(o.is_active, true)
            and o.role in ('alliance', 'alliance_partner', 'alliance_member')
        )
      );
    revoke all on public.referral_ledger from anon;
    revoke insert, update, delete, truncate, references, trigger on public.referral_ledger from authenticated;
  end if;

  if to_regclass('public.payout_reviews') is not null then
    drop policy if exists operator_read_payout_reviews on public.payout_reviews;
    drop policy if exists payout_reviews_operator_read on public.payout_reviews;
    alter table public.payout_reviews enable row level security;
    create policy payout_reviews_operator_read on public.payout_reviews
      for select to authenticated using (public.is_operator());
    revoke all on public.payout_reviews from anon;
    revoke insert, update, delete, truncate, references, trigger on public.payout_reviews from authenticated;
  end if;

  if to_regclass('public.partner_scorecards') is not null then
    drop policy if exists operator_read_partner_scorecards on public.partner_scorecards;
    drop policy if exists partner_scorecards_operator_read on public.partner_scorecards;
    alter table public.partner_scorecards enable row level security;
    create policy partner_scorecards_operator_read on public.partner_scorecards
      for select to authenticated using (public.is_operator());
    revoke all on public.partner_scorecards from anon;
    revoke insert, update, delete, truncate, references, trigger on public.partner_scorecards from authenticated;
  end if;

  if to_regclass('public.translation_entries') is not null then
    drop policy if exists "authenticated translation reviewers can read entries" on public.translation_entries;
    drop policy if exists translation_entries_operator_read on public.translation_entries;
    alter table public.translation_entries enable row level security;
    create policy translation_entries_operator_read on public.translation_entries
      for select to authenticated using (public.is_operator());
    revoke all on public.translation_entries from anon;
  end if;
end $$;
