import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// 20261112130000 skips operators_user_id_uidx when duplicate user bindings exist. The follow-on
// migration must install all three unique indexes or stop: it never completes without them and
// never rewrites rows.

const IDENTITY = fs.readFileSync("supabase/migrations/20261112130000_alliance_operator_identity.sql", "utf8");
const REQUIRE = fs.readFileSync("supabase/migrations/20261114110000_require_operator_unique_indexes.sql", "utf8");
const INDEXES = ["operators_profile_id_uidx", "operators_referral_code_uidx", "operators_user_id_uidx"];

async function hosted(rows: string) {
  const db = new PGlite();
  await db.exec(`create table public.sales_leads(id uuid primary key);
    create table public.operator_profiles(id uuid primary key default gen_random_uuid(), email text unique not null);
    create table public.operators(id uuid primary key default gen_random_uuid(), user_id uuid, email text not null unique, full_name text, role text, is_active bool default true, created_at timestamptz default now(), updated_at timestamptz default now());
    ${rows}`);
  return db;
}
const indexes = async (db: PGlite) => (await db.query<{ i: string }>(`select indexname i from pg_indexes where indexname = any($1) order by 1`, [INDEXES])).rows.map((r) => r.i);
const U = "00000000-0000-4000-8000-000000000001";

test("production shape (no duplicates): all three unique indexes are installed and re-applying is a no-op", async () => {
  const db = await hosted("");
  await db.exec(IDENTITY);
  await db.exec(REQUIRE);
  await db.exec(REQUIRE);
  assert.deepEqual(await indexes(db), INDEXES);
  await db.close();
});

test("an index skipped by 20261112130000 is installed once the data allows it", async () => {
  const db = await hosted(`insert into public.operators(user_id, email) values ('${U}', 'a@example.invalid'), ('${U}', 'b@example.invalid');`);
  await db.exec(IDENTITY);
  assert.deepEqual(await indexes(db), ["operators_profile_id_uidx", "operators_referral_code_uidx"], "130000 skips the user_id index");
  await assert.rejects(() => db.exec(REQUIRE), /OPERATOR_USER_ID_NOT_UNIQUE/, "duplicates stop the migration");
  assert.equal((await db.query<{ n: number }>("select count(*)::int n from public.operators")).rows[0].n, 2, "no rows rewritten");
  await db.exec("update public.operators set user_id = null where email = 'b@example.invalid'");
  await db.exec(REQUIRE);
  assert.deepEqual(await indexes(db), INDEXES);
  await assert.rejects(() => db.exec(`insert into public.operators(user_id, email) values ('${U}', 'c@example.invalid')`), /duplicate key/);
  await db.close();
});

test("migration only creates indexes or raises; it never deletes or rewrites", () => {
  const sql = REQUIRE.replace(/--.*$/gm, "");
  assert.doesNotMatch(sql, /\b(delete|update|truncate|drop|alter)\b/i);
  assert.match(sql, /raise exception/);
});
