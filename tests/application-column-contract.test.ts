import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Regression for application columns missing from hosted tables (read-only P12 catalog,
// 2026-11-12). Fixtures are the hosted shapes of portal_otps and wise_webhook_events.

const MIGRATION = fs.readFileSync("supabase/migrations/20261112110000_restore_application_column_contract.sql", "utf8");
const HOSTED = `
  create table public.portal_otps(id uuid primary key default gen_random_uuid(), email text not null, otp text not null,
    expires_at timestamptz not null, used bool default false, created_at timestamptz default now());
  create table public.wise_webhook_events(id uuid primary key default gen_random_uuid(), delivery_id text, subscription_id text,
    event_type text not null, schema_version text, signature_valid bool not null, test_notification bool not null, environment text not null,
    resource_type text, resource_id text, current_state text, previous_state text, occurred_at timestamptz, raw_payload jsonb not null,
    processed bool not null, processed_at timestamptz, processing_error text, received_at timestamptz not null default now());
`;
const OTHER_TABLES = ["deals", "discount_redemptions", "identifier_locks", "matter_events", "receiving_authorities", "shippo_tracking_events"];
async function hosted() {
  const db = new PGlite();
  await db.exec(HOSTED);
  for (const t of OTHER_TABLES) await db.exec(`create table public.${t}(id uuid primary key default gen_random_uuid()${t === "receiving_authorities" ? ", name text" : ""})`);
  return db;
}
const DEAL = "00000000-0000-4000-8000-000000000001";
// Same statement shape PostgREST issues for portal/verify: upsert({deal_id,...},{onConflict:"deal_id"}).
const issueCode = (db: PGlite, otp: string) =>
  db.query("insert into public.portal_otps(deal_id,email,otp,expires_at,used) values($1,'c@example.invalid',$2,now()+interval '10 minutes',false) on conflict (deal_id) do update set otp=excluded.otp, expires_at=excluded.expires_at, used=false", [DEAL, otp]);

test("portal sign-in: issuing a code fails on the hosted shape and works after the migration", async () => {
  const db = await hosted();
  await assert.rejects(() => issueCode(db, "AAA111"), /deal_id/);
  await db.exec(MIGRATION);
  await issueCode(db, "AAA111");
  await issueCode(db, "BBB222"); // re-issue replaces, never duplicates
  const rows = (await db.query<{ otp: string; used: boolean }>("select otp, used from public.portal_otps where deal_id=$1", [DEAL])).rows;
  assert.deepEqual(rows, [{ otp: "BBB222", used: false }]);
  // Confirm marks the code used without nulling otp (NOT NULL); a second consume finds nothing.
  assert.equal((await db.query("update public.portal_otps set used=true where deal_id=$1 and used=false returning id", [DEAL])).rows.length, 1);
  assert.equal((await db.query("update public.portal_otps set used=true where deal_id=$1 and used=false returning id", [DEAL])).rows.length, 0);
  await db.close();
});

test("Wise webhook audit insert fails on the hosted shape and works after the migration", async () => {
  const db = await hosted();
  const insert = () => db.query(`insert into public.wise_webhook_events(delivery_id,event_type,signature_valid,test_notification,environment,raw_payload,processed,idempotency_hash)
    values('d-1','transfers#state-change',true,false,'sandbox','{}',false,'h')`);
  await assert.rejects(insert, /idempotency_hash/);
  await db.exec(MIGRATION);
  await insert();
  await db.close();
});

test("migration is additive, idempotent and copies authority names without overwriting", async () => {
  const db = await hosted();
  await db.exec("insert into public.receiving_authorities(name) values('Comune di Roma')");
  await db.exec(MIGRATION);
  await db.exec("update public.receiving_authorities set authority_name='Operator-edited'");
  await db.exec(MIGRATION); // second run must not overwrite
  assert.equal((await db.query<{ authority_name: string }>("select authority_name from public.receiving_authorities")).rows[0].authority_name, "Operator-edited");
  await db.close();
  const statements = MIGRATION.replace(/--.*$/gm, "").replace(/do \$\$[\s\S]*?\$\$;/g, "").split(";").map((s) => s.trim()).filter(Boolean);
  for (const s of statements) assert.match(s, /^alter table public\.\w+ add column if not exists \w+ (text|uuid|numeric|boolean|integer|timestamptz)$/, s);
  assert.doesNotMatch(MIGRATION.replace(/--.*$/gm, ""), /\b(drop|delete|truncate|grant|revoke|alter column)\b/i);
});

test("portal confirm consumes the code without nulling otp and fails closed", () => {
  const source = fs.readFileSync("app/api/portal/confirm/route.ts", "utf8");
  assert.doesNotMatch(source, /otp:\s*null/);
  assert.match(source, /\.update\(\{ used: true \}\)\s*\.eq\("id", record\.id\)\s*\.eq\("used", false\)/);
  assert.match(source, /if \(consumeError \|\| !consumed\?\.length\)/);
  assert.ok(source.indexOf("consumeError") < source.indexOf("const session = buildSession("), "session is issued only after the code is consumed");
});
