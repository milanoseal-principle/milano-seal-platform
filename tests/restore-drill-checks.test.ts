import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";

// The isolated restore drill runs supabase/verification/restore_drill_checks.sql against the
// restored copy and fails if an anonymous or arbitrary signed-in caller can read sensitive rows.
// This proves the checks run on the canonical schema, tolerate tables a restore may lack, and
// actually detect an exposure rather than reporting zero on any input.

const CHECKS = fs.readFileSync("supabase/verification/restore_drill_checks.sql", "utf8");
const files = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
type Checks = Record<string, unknown>;
const run = async (db: Awaited<ReturnType<typeof isolatedCanonicalDatabase>>) =>
  ((await db.exec(CHECKS)).at(-1)!.rows[0] as { restore_drill_checks: Checks }).restore_drill_checks;

test("checks run on the canonical schema and report no exposure when RLS holds", async () => {
  const db = await isolatedCanonicalDatabase(files());
  try {
    await db.exec("insert into public.audit_events(event_type) values ('synthetic')");
    const checks = await run(db);
    assert.equal(checks.rls_probe_rows_visible_to_anon, 0);
    assert.equal(checks.rls_probe_rows_visible_to_arbitrary_client, 0);
    assert.ok(Number(checks.rls_probe_tables_checked) >= 10);
    assert.deepEqual(checks.rls_probe_tables_exposed, []);
    assert.equal(checks.migration_ledger_entries, null, "an absent ledger is reported, not a failure");
    assert.equal(checks.founder_admin_helper_reads_user_metadata, false);
  } finally {
    await db.close();
  }
});

test("checks detect a table that anonymous and signed-in callers can read", async () => {
  const db = await isolatedCanonicalDatabase(files());
  try {
    await db.exec(`insert into public.audit_events(event_type) values ('synthetic');
      create policy drill_exposed on public.audit_events for select to anon, authenticated using (true);
      grant select on public.audit_events to anon, authenticated;`);
    const checks = await run(db);
    assert.equal(checks.rls_probe_rows_visible_to_anon, 1);
    assert.equal(checks.rls_probe_rows_visible_to_arbitrary_client, 1);
    assert.deepEqual(checks.rls_probe_tables_exposed, ["anon:audit_events", "authenticated:audit_events"]);
  } finally {
    await db.close();
  }
});

test("checks output counts and booleans only, never row values", () => {
  const select = CHECKS.slice(CHECKS.lastIndexOf("select jsonb_build_object("));
  assert.doesNotMatch(select, /select\s+(\*|email|client_name|name|metadata|payload)\b/i);
  assert.doesNotMatch(CHECKS, /\b(insert|update|delete)\s+(into\s+)?public\./i, "checks never write application tables");
});

test("a GENESIS chain root is not an unlinked custody row; a missing predecessor still is", async () => {
  const db = await isolatedCanonicalDatabase(files());
  try {
    const required = (await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'custody_ledger' and is_nullable = 'NO' and column_default is null",
    )).rows.map((r) => r.column_name);
    const deal = (await db.query<{ id: string }>("insert into public.deals(email) values ('drill@example.invalid') returning id::text")).rows[0].id;
    const insert = async (hash: string, prev: string) => {
      const values: Record<string, string> = { deal_id: deal, hash, prev_hash: prev };
      for (const c of required) values[c] ??= "synthetic";
      const keys = Object.keys(values);
      const params = keys.map((_, i) => "$" + String(i + 1)).join(",");
      await db.query("insert into public.custody_ledger(" + keys.join(",") + ") values (" + params + ")", Object.values(values));
    };
    // Fixture rows only: bypass the append-only evidence triggers for this disposable database.
    await db.exec("set session_replication_role = replica");
    await insert("h1", "GENESIS");
    await insert("h2", "h1");
    await insert("h3", "missing-parent");
    const legacy = (await db.query<{ n: number }>(
      "select count(*)::int n from public.custody_ledger c where c.prev_hash is not null and not exists (select 1 from public.custody_ledger p where p.deal_id = c.deal_id and p.hash = c.prev_hash)",
    )).rows[0].n;
    assert.equal(legacy, 2, "the previous diagnostic miscounted the genesis root");
    assert.equal((await run(db)).custody_chain_unlinked_rows, 1, "only the genuinely missing predecessor is counted");
  } finally {
    await db.close();
  }
});
