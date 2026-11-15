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

test("a custody chain's GENESIS row is not reported as unlinked; a broken link is", async () => {
  const db = await isolatedCanonicalDatabase(files());
  try {
    const deal = "30000000-0000-4000-8000-000000000001", other = "30000000-0000-4000-8000-000000000002";
    await db.exec(`set session_replication_role = replica;
      insert into public.custody_ledger(deal_id, event, hash, prev_hash) values
        ('${deal}', 'synthetic', 'h1', 'GENESIS'), ('${deal}', 'synthetic', 'h2', 'h1'),
        ('${other}', 'synthetic', 'o1', 'GENESIS');
      set session_replication_role = origin;`);
    let checks = await run(db);
    assert.equal(checks.custody_chain_genesis_rows, 2);
    assert.equal(checks.custody_chain_unlinked_rows, 0, "chain starts are not breaks");
    await db.exec(`set session_replication_role = replica;
      insert into public.custody_ledger(deal_id, event, hash, prev_hash) values ('${deal}', 'synthetic', 'h9', 'missing'), ('${other}', 'synthetic', 'o2', 'h2');
      set session_replication_role = origin;`);
    checks = await run(db);
    assert.equal(checks.custody_chain_unlinked_rows, 2);
    assert.equal(checks.custody_chain_cross_matter_links, 1);
  } finally {
    await db.close();
  }
});

test("checks output counts and booleans only, never row values", () => {
  const select = CHECKS.slice(CHECKS.lastIndexOf("select jsonb_build_object("));
  assert.doesNotMatch(select, /select\s+(\*|email|client_name|name|metadata|payload)\b/i);
  assert.doesNotMatch(CHECKS, /\b(insert|update|delete)\s+(into\s+)?public\./i, "checks never write application tables");
});
