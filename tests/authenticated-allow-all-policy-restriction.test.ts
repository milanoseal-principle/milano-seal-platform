import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Regression for hosted RLS policies that gave every signed-in account unrestricted access
// (P12 read-only catalog, 2026-11-14T16:13:18Z). The fixture reproduces the hosted conditions:
// RLS enabled, Supabase-default privileges for anon/authenticated, and the seven policies whose
// expressions hash to md5('true'). It proves the migration denies anonymous, client, partner and
// revoked accounts, scopes partners to their own referral rows, and keeps operator and
// service-role access.

const MIGRATION = "supabase/migrations/20261114090000_restrict_authenticated_allow_all_policies.sql";
const migration = fs.readFileSync(MIGRATION, "utf8");
const TABLES = ["liaison_intake_records", "referral_ledger", "payout_reviews", "partner_scorecards", "translation_entries"];

const ID = {
  client: "00000000-0000-4000-8000-000000000001",
  operator: "00000000-0000-4000-8000-000000000002",
  partnerA: "00000000-0000-4000-8000-000000000003",
  partnerB: "00000000-0000-4000-8000-000000000004",
  revoked: "00000000-0000-4000-8000-000000000005",
  forged: "00000000-0000-4000-8000-000000000006",
};
const OP = { partnerA: "10000000-0000-4000-8000-000000000003", partnerB: "10000000-0000-4000-8000-000000000004" };

async function hostedFixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users(id uuid primary key, raw_app_meta_data jsonb not null default '{}', raw_user_meta_data jsonb not null default '{}', banned_until timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
    insert into auth.users(id, raw_app_meta_data, raw_user_meta_data) values
      ('${ID.client}', '{"role":"client"}', '{}'),
      ('${ID.operator}', '{"role":"founder_admin"}', '{}'),
      ('${ID.partnerA}', '{"role":"alliance_partner"}', '{}'),
      ('${ID.partnerB}', '{"role":"alliance_partner"}', '{}'),
      ('${ID.revoked}', '{"role":"admin_operator","disabled":"true"}', '{}'),
      ('${ID.forged}', '{"role":"client"}', '{"role":"founder_admin"}');
  `);
  await db.exec(fs.readFileSync("supabase/migrations/20261108180000_operator_authority_prerequisite.sql", "utf8"));
  await db.exec(`
    create table public.operators(id uuid primary key, user_id uuid, role text, is_active boolean default true);
    -- As in a database built from the repository: RLS on, no SELECT policy for authenticated.
    alter table public.operators enable row level security;
    insert into public.operators(id, user_id, role, is_active) values
      ('${OP.partnerA}', '${ID.partnerA}', 'alliance_partner', true),
      ('${OP.partnerB}', '${ID.partnerB}', 'alliance_partner', false);

    create table public.liaison_intake_records(id text primary key, private_case_note text);
    create table public.referral_ledger(id serial primary key, partner_id uuid, referral_code text);
    create table public.payout_reviews(id serial primary key, partner_id uuid, review_status text default 'pending');
    create table public.partner_scorecards(id serial primary key, partner_id uuid);
    create table public.translation_entries(id serial primary key, content_key text, review_status text default 'APPROVED');
  `);
  for (const table of TABLES) {
    await db.exec(`alter table public.${table} enable row level security;
      grant all on public.${table} to anon, authenticated, service_role;`);
  }
  await db.exec(`
    grant usage on all sequences in schema public to anon, authenticated, service_role;
    insert into public.liaison_intake_records values ('L-1', 'synthetic private note');
    insert into public.referral_ledger(partner_id, referral_code) values ('${OP.partnerA}', 'A1'), ('${OP.partnerB}', 'B1'), (null, 'direct');
    insert into public.payout_reviews(partner_id) values ('${OP.partnerA}');
    insert into public.partner_scorecards(partner_id) values ('${OP.partnerA}');
    insert into public.translation_entries(content_key) values ('home.hero');

    create policy liaison_intake_authenticated_select on public.liaison_intake_records for select to authenticated using (true);
    create policy liaison_intake_authenticated_insert on public.liaison_intake_records for insert to authenticated with check (true);
    create policy liaison_intake_authenticated_update on public.liaison_intake_records for update to authenticated using (true) with check (true);
    create policy operator_read_referral_ledger on public.referral_ledger for select to authenticated using (true);
    create policy service_role_referral_ledger on public.referral_ledger for all to service_role using (true);
    create policy operator_read_payout_reviews on public.payout_reviews for select to authenticated using (true);
    create policy service_role_payout_reviews on public.payout_reviews for all to service_role using (true);
    create policy operator_read_partner_scorecards on public.partner_scorecards for select to authenticated using (true);
    create policy service_role_partner_scorecards on public.partner_scorecards for all to service_role using (true);
    create policy "authenticated translation reviewers can read entries" on public.translation_entries for select to authenticated using (true);
    create policy "operator translation reviewers can update entries" on public.translation_entries for update to authenticated
      using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('founder_admin','admin','admin_operator','ops_manager','translation_coordinator'));
  `);
  return db;
}

async function as<T>(db: PGlite, role: string, sub: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  if (sub) await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [sub, JSON.stringify({ sub })]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)");
  }
}
const count = async (db: PGlite, table: string) => (await db.query<{ n: number }>(`select count(*)::int n from public.${table}`)).rows[0].n;
const ledgerCodes = async (db: PGlite) => (await db.query<{ referral_code: string }>("select referral_code from public.referral_ledger order by referral_code")).rows.map((r) => r.referral_code);

test("hosted fixture reproduces the exposure before the migration", async () => {
  const db = await hostedFixture();
  for (const table of TABLES) assert.equal(await as(db, "authenticated", ID.client, () => count(db, table)), table === "referral_ledger" ? 3 : 1, `client reads ${table}`);
  await as(db, "authenticated", ID.client, () => db.query("update public.liaison_intake_records set private_case_note = 'client rewrite'"));
  await as(db, "authenticated", ID.client, () => db.query("insert into public.liaison_intake_records values ('L-forged', 'forged')"));
  assert.equal(await count(db, "liaison_intake_records"), 2);
  await db.close();
});

test("anonymous, client, revoked and user_metadata-forged accounts lose all access", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  for (const sub of [ID.client, ID.revoked, ID.forged]) {
    for (const table of TABLES) assert.equal(await as(db, "authenticated", sub, () => count(db, table)), 0, `${sub} cannot read ${table}`);
    const updated = await as(db, "authenticated", sub, () => db.query("update public.liaison_intake_records set private_case_note = 'rewrite' returning id"));
    assert.equal(updated.rows.length, 0);
    await assert.rejects(() => as(db, "authenticated", sub, () => db.query("insert into public.liaison_intake_records values ('L-x', 'forged')")), /row-level security/);
  }
  for (const table of TABLES) await assert.rejects(() => as(db, "anon", null, () => count(db, table)), /permission denied/, `anon has no privilege on ${table}`);
  assert.equal((await db.query<{ private_case_note: string }>("select private_case_note from public.liaison_intake_records")).rows[0].private_case_note, "synthetic private note");
  await db.close();
});

test("partners read only their own referral rows, even without any operators read policy", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  assert.deepEqual(await as(db, "authenticated", ID.partnerA, () => ledgerCodes(db)), ["A1"]);
  // An inactive partner account reads nothing, including its own historical rows.
  assert.deepEqual(await as(db, "authenticated", ID.partnerB, () => ledgerCodes(db)), []);
  for (const table of ["payout_reviews", "partner_scorecards", "liaison_intake_records", "translation_entries"]) {
    assert.equal(await as(db, "authenticated", ID.partnerA, () => count(db, table)), 0, `partner cannot read ${table}`);
  }
  await assert.rejects(() => as(db, "authenticated", ID.partnerA, () => db.query("insert into public.referral_ledger(partner_id, referral_code) values ($1, 'forged')", [OP.partnerA])), /permission denied/);
  // The ownership helper answers only for the caller and is not callable anonymously.
  assert.equal((await as(db, "authenticated", ID.partnerA, () => db.query<{ ok: boolean }>("select public.is_own_alliance_account($1) ok", [OP.partnerB]))).rows[0].ok, false);
  assert.equal((await db.query<{ ok: boolean }>("select has_function_privilege('anon', 'public.is_own_alliance_account(uuid)', 'execute') ok")).rows[0].ok, false);
  await db.close();
});

test("operators and the service role keep their access", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  for (const table of TABLES) {
    assert.equal(await as(db, "authenticated", ID.operator, () => count(db, table)), table === "referral_ledger" ? 3 : 1, `operator reads ${table}`);
    assert.equal(await as(db, "service_role", null, () => count(db, table)), table === "referral_ledger" ? 3 : 1, `service role reads ${table}`);
  }
  await as(db, "authenticated", ID.operator, () => db.query("update public.liaison_intake_records set private_case_note = 'operator review'"));
  await as(db, "authenticated", ID.operator, () => db.query("insert into public.liaison_intake_records values ('L-2', 'operator intake')"));
  await as(db, "service_role", null, () => db.query("insert into public.referral_ledger(partner_id, referral_code) values (null, 'server')"));
  assert.equal(await count(db, "liaison_intake_records"), 2);
  await db.close();
});

test("migration is idempotent, drops only the seven named policies and is a no-op on a bare database", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  await db.exec(migration);
  const policies = (await db.query<{ name: string }>("select tablename || '.' || policyname as name from pg_policies where schemaname = 'public' order by 1")).rows.map((r) => r.name);
  assert.deepEqual(policies, [
    "liaison_intake_records.liaison_intake_operator_insert",
    "liaison_intake_records.liaison_intake_operator_select",
    "liaison_intake_records.liaison_intake_operator_update",
    "partner_scorecards.partner_scorecards_operator_read",
    "partner_scorecards.service_role_partner_scorecards",
    "payout_reviews.payout_reviews_operator_read",
    "payout_reviews.service_role_payout_reviews",
    "referral_ledger.referral_ledger_operator_read",
    "referral_ledger.referral_ledger_partner_read_own",
    "referral_ledger.service_role_referral_ledger",
    "translation_entries.operator translation reviewers can update entries",
    "translation_entries.translation_entries_operator_read",
  ]);
  await db.close();
  // A bare Supabase database: platform roles and auth schema, none of the application tables.
  const fresh = new PGlite();
  await fresh.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;`);
  await fresh.exec(migration);
  assert.equal((await fresh.query("select 1 from pg_policies")).rows.length, 0, "no tables, no policies");
  await fresh.close();
  assert.doesNotMatch(migration.replace(/--.*$/gm, ""), /\b(delete\s+from|truncate\s+(table\s+)?public|drop\s+table|drop\s+column|update\s+public)/i);
});


test("forward reconciliation reproduces hosted legacy helper and restores canonical staff isolation", async () => {
  const db = await hostedFixture();
  try {
    await db.exec(migration);
    await db.exec(`
      create table public.deals(id text primary key);
      alter table public.deals enable row level security;
      grant all on public.deals to authenticated, service_role;
      insert into public.deals values ('synthetic-matter');
      create policy staff_read on public.deals for select to authenticated using (public.is_operator());
      create policy staff_update on public.deals for update to authenticated using (public.is_operator()) with check (public.is_operator());
      create or replace function public.is_operator() returns boolean
      language plpgsql security definer set search_path = public, pg_temp as $$
      begin return exists(select 1 from operators where user_id=auth.uid() and is_active=true); end;
      $$;
    `);
    const operatorAllowed = (sub: string) => as(db, "authenticated", sub, async () =>
      (await db.query<{ ok: boolean }>("select public.is_operator() ok")).rows[0].ok);
    // Reproduce the hosted discrepancy, not only the fresh migration fixture.
    assert.equal(await operatorAllowed(ID.operator), false);
    assert.equal(await operatorAllowed(ID.partnerA), true);
    assert.equal(await as(db, "authenticated", ID.partnerA, () => count(db, "deals")), 1);

    const patch = fs.readFileSync("supabase/migrations/20261125231600_reconcile_hosted_operator_authority.sql", "utf8");
    await db.exec(patch);
    await db.exec(patch); // replay safety
    assert.equal(await operatorAllowed(ID.operator), true);
    assert.equal(await as(db, "authenticated", ID.operator, () => count(db, "deals")), 1);
    for (const sub of [ID.client, ID.partnerA, ID.partnerB, ID.revoked, ID.forged]) {
      assert.equal(await operatorAllowed(sub), false);
      assert.equal(await as(db, "authenticated", sub, () => count(db, "deals")), 0);
    }
    assert.deepEqual(await as(db, "authenticated", ID.partnerA, () => ledgerCodes(db)), ["A1"]);
    assert.deepEqual(await as(db, "authenticated", ID.partnerB, () => ledgerCodes(db)), []);
    for (const table of ["liaison_intake_records", "payout_reviews", "partner_scorecards", "translation_entries"]) {
      assert.equal(await as(db, "authenticated", ID.partnerA, () => count(db, table)), 0);
      assert.equal(await as(db, "authenticated", ID.operator, () => count(db, table)), 1);
    }
    // Disabled/banned or revoked server-side roles win over stale token claims.
    await db.exec(`update auth.users set banned_until=now()+interval '1 day' where id='${ID.operator}'`);
    assert.equal(await operatorAllowed(ID.operator), false);
    await db.exec(`update auth.users set banned_until=null, raw_app_meta_data='{"role":"client"}' where id='${ID.operator}'`);
    assert.equal(await operatorAllowed(ID.operator), false);
    await db.exec(`update auth.users set raw_app_meta_data='{"role":"admin_operator"}' where id='${ID.operator}'`);
    assert.equal(await operatorAllowed(ID.operator), true);
    await db.exec(`insert into public.operators(id,user_id,role,is_active)
      values ('10000000-0000-4000-8000-000000000002','${ID.operator}','operator',false)`);
    assert.equal(await operatorAllowed(ID.operator), false);
    await db.exec(`update public.operators set is_active=true,role='alliance_partner' where user_id='${ID.operator}'`);
    assert.equal(await operatorAllowed(ID.operator), false);
    await db.exec(`update public.operators set role='operator' where user_id='${ID.operator}'`);
    assert.equal(await operatorAllowed(ID.operator), true);
    assert.equal((await db.query<{ ok: boolean }>("select has_function_privilege('anon','public.is_operator()','execute') ok")).rows[0].ok, false);
    await assert.rejects(() => as(db, "authenticated", ID.operator, () => db.query("update public.deals set id='forged'")), /permission denied/);
    assert.equal(await as(db, "service_role", null, () => count(db, "deals")), 1);
    assert.equal((await db.query<{ id: string }>("select id from public.deals")).rows[0].id, "synthetic-matter");
  } finally {
    await db.close();
  }
});
