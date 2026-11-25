import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { migrationFixture } from "../../scripts/lib/migration-fixture.mjs";

// Real PostgreSQL (PGlite) after replaying every migration in canonical order.
// Exercises the label-isolated tracking RPC and the attempt-bound
// reconciliation RPC end to end; no network, no provider calls.

type Db = { exec(sql: string): Promise<unknown>; query<T = Record<string, unknown>>(sql: string): Promise<{ rows: T[] }> };

const MATTER = "11111111-1111-1111-1111-111111111111";
const LEG = "22222222-2222-2222-2222-222222222222";
const ACTOR = "33333333-3333-3333-3333-333333333333";

const ISOLATION_MIGRATION = "20261125100000_shipment_leg_tracking_label_isolation.sql";

async function replay(db: Db, options: { before?: (name: string) => Promise<void> } = {}) {
  const plan = JSON.parse(readFileSync("supabase/migration-replay-plan.json", "utf8")) as { fresh_database_prerequisites: string[] };
  const files = readdirSync("supabase/migrations").filter((name) => name.endsWith(".sql")).sort();
  for (const name of [...plan.fresh_database_prerequisites, ...files.filter((file) => !plan.fresh_database_prerequisites.includes(file))]) {
    if (options.before) await options.before(name);
    await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
  }
}

/**
 * Production shape (verified drift): shippo_tracking_events existed before 015
 * and lacks shippo_shipment_id / shippo_transaction_id when migration 2 runs.
 */
const productionDrift = (db: Db) => async (name: string) => {
  if (name === ISOLATION_MIGRATION) {
    await db.exec(`alter table public.shippo_tracking_events drop column shippo_shipment_id, drop column shippo_transaction_id;`);
  }
};

async function freshDb(options: { productionShape?: boolean } = {}): Promise<Db> {
  const db = (await migrationFixture()) as Db;
  await replay(db, options.productionShape ? { before: productionDrift(db) } : {});
  // Fixture rows only (replica role skips unrelated deal triggers for insertion).
  await db.exec(`set session_replication_role = replica;
    insert into public.deals(id) values ('${MATTER}');
    insert into public.matter_shipment_legs(id, matter_id, provider, leg_type, sequence, direction, origin_json, destination_json,
      rate_snapshot, label_status, custody_status, provider_evidence, provider_transaction_id, tracking_number)
    values ('${LEG}', '${MATTER}', 'shippo', 'final_international', 1, 'final', '{}', '{}',
      '{"provider_rate_id":"r_old"}', 'created', 'handoff_ready', '{}', 'txn_old', 'OLDTRACK01');
    set session_replication_role = origin;`);
  return db;
}

const leg = async (db: Db) =>
  (await db.query<{ label_status: string; custody_status: string; tracking_status: string | null; label_claim_id: string | null }>(
    `select label_status, custody_status, tracking_status, label_claim_id::text from public.matter_shipment_legs where id = '${LEG}'`,
  )).rows[0];

const track = (db: Db, hash: string, status: string, tracking: string | null, txn: string | null) =>
  db.query<{ outcome: string; custody_status: string }>(
    `select * from public.record_shipment_leg_label_tracking('${MATTER}', '${LEG}', '${hash}', '${status}', null, null, now(), 'ups', '{}',
      ${tracking ? `'${tracking}'` : "null"}, ${txn ? `'${txn}'` : "null"})`,
  ).then((result) => result.rows[0]);

test("voided-label tracking events are preserved as history but never move current custody", { timeout: 240_000 }, async () => {
  const db = await freshDb();

  // The current label's event is applied through the existing tracking RPC.
  assert.equal((await track(db, "h1", "TRANSIT", "OLDTRACK01", "txn_old")).outcome, "applied");
  assert.equal((await leg(db)).custody_status, "in_transit");

  // Operator voids; re-quotes; claims a replacement purchase.
  await db.exec(`update public.matter_shipment_legs set label_status = 'voided', custody_status = 'handoff_ready', shipped_at = null where id = '${LEG}'`);
  await db.exec(`update public.matter_shipment_legs set label_status = 'rate_selected', rate_snapshot = '{"provider_rate_id":"r_new"}' where id = '${LEG}'`);
  await db.query(`select 1 from public.claim_shipment_leg_label('${MATTER}', '${LEG}')`);
  const pending = await leg(db);
  assert.equal(pending.label_status, "purchase_pending");

  // A late DELIVERED event for the OLD label while the replacement is pending.
  const late = await track(db, "h2", "DELIVERED", "OLDTRACK01", "txn_old");
  assert.equal(late.outcome, "isolated_not_current_label");
  const afterLate = await leg(db);
  assert.equal(afterLate.custody_status, "handoff_ready", "old label must not deliver the pending leg");
  assert.equal(afterLate.label_claim_id, pending.label_claim_id, "claim identity unchanged");
  assert.equal(afterLate.tracking_status, pending.tracking_status);

  // History preserved under the EVENT's own identifiers.
  const history = (await db.query<{ tracking_number: string; shippo_transaction_id: string; status: string }>(
    `select tracking_number, shippo_transaction_id, status from public.shippo_tracking_events where event_hash = 'h2'`,
  )).rows[0];
  assert.deepEqual(history, { tracking_number: "OLDTRACK01", shippo_transaction_id: "txn_old", status: "DELIVERED" });
  // Replay of the same event is idempotent.
  assert.equal((await track(db, "h2", "DELIVERED", "OLDTRACK01", "txn_old")).outcome, "duplicate");

  // Replacement label recorded; an old-label event still cannot act on it.
  await db.query(`select 1 from public.record_shipment_leg_label('${MATTER}', '${LEG}', true, 'txn_new', 'NEWTRACK02', '{}', '${ACTOR}')`);
  assert.equal((await track(db, "h3", "TRANSIT", "OLDTRACK01", null)).outcome, "isolated_not_current_label");
  assert.equal((await track(db, "h4", "TRANSIT", "NEWTRACK02", "txn_old")).outcome, "isolated_not_current_label", "mixed identifiers fail closed");
  assert.equal((await leg(db)).custody_status, "handoff_ready");

  // The new label's own event applies.
  assert.equal((await track(db, "h5", "TRANSIT", "NEWTRACK02", "txn_new")).outcome, "applied");
  assert.equal((await leg(db)).custody_status, "in_transit");

  // Client roles cannot call either RPC.
  await db.exec("set role authenticated");
  await assert.rejects(track(db, "h6", "DELIVERED", "NEWTRACK02", "txn_new"), /permission denied/);
  await assert.rejects(
    db.query(`select public.reconcile_shipment_leg_label('${MATTER}', '${LEG}', gen_random_uuid(), false, null, null, '{}', '${ACTOR}')`),
    /permission denied/,
  );
  await db.exec("reset role");
});

test("reconciliation is bound to the immutable claim under the row lock", { timeout: 240_000 }, async () => {
  const db = await freshDb();
  await db.exec(`update public.matter_shipment_legs set label_status = 'rate_selected' where id = '${LEG}'`);
  await db.query(`select 1 from public.claim_shipment_leg_label('${MATTER}', '${LEG}')`);
  const claim1 = (await leg(db)).label_claim_id;
  assert.ok(claim1);

  // A stale (isolated) tracking write does not change the claim.
  await track(db, "s1", "TRANSIT", "OLDTRACK01", "txn_old");
  assert.equal((await leg(db)).label_claim_id, claim1);

  const reconcile = (claim: string) =>
    db.query<{ label_status: string }>(
      `select label_status from public.reconcile_shipment_leg_label('${MATTER}', '${LEG}', '${claim}', false, null, null, '{}', '${ACTOR}')`,
    );
  assert.equal((await reconcile(claim1!)).rows[0].label_status, "rate_selected");

  await db.query(`select 1 from public.claim_shipment_leg_label('${MATTER}', '${LEG}')`);
  const claim2 = (await leg(db)).label_claim_id;
  assert.notEqual(claim2, claim1);
  await assert.rejects(reconcile(claim1!), /RECONCILE_ATTEMPT_CHANGED/);
  assert.equal((await leg(db)).label_status, "purchase_pending");
});

test("a label recorded without a tracking number still accepts its own transaction-matched events", { timeout: 240_000 }, async () => {
  const db = await freshDb();
  // Purchase succeeded but the provider returned no tracking number.
  await db.exec(`update public.matter_shipment_legs set tracking_number = null, provider_transaction_id = 'txn_only' where id = '${LEG}'`);
  assert.equal((await track(db, "t1", "TRANSIT", "LATETRACK9", "txn_only")).outcome, "applied");
  assert.equal((await leg(db)).custody_status, "in_transit");
  // A conflicting transaction is still rejected, and a tracking-only event cannot claim an untracked label.
  assert.equal((await track(db, "t2", "DELIVERED", "LATETRACK9", "txn_other")).outcome, "isolated_not_current_label");
  assert.equal((await track(db, "t3", "DELIVERED", "LATETRACK9", null)).outcome, "isolated_not_current_label");
  assert.equal((await leg(db)).custody_status, "in_transit");
});

test("production-shaped replay: migration 2 restores the identity columns and isolation works end to end", { timeout: 240_000 }, async () => {
  const db = await freshDb({ productionShape: true });
  const columns = (await db.query<{ column_name: string }>(
    `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'shippo_tracking_events'
       and column_name in ('shippo_shipment_id', 'shippo_transaction_id') order by column_name`,
  )).rows.map((row) => row.column_name);
  assert.deepEqual(columns, ["shippo_shipment_id", "shippo_transaction_id"]);
  // Current-label event goes through the EXISTING 086 RPC, which writes both columns.
  assert.equal((await track(db, "p1", "TRANSIT", "OLDTRACK01", "txn_old")).outcome, "applied");
  await db.exec(`update public.matter_shipment_legs set label_status = 'voided' where id = '${LEG}'`);
  assert.equal((await track(db, "p2", "DELIVERED", "OLDTRACK01", "txn_old")).outcome, "isolated_not_current_label");
  assert.equal((await leg(db)).custody_status, "in_transit");
  const stored = (await db.query<{ shippo_transaction_id: string }>(`select shippo_transaction_id from public.shippo_tracking_events where event_hash = 'p2'`)).rows[0];
  assert.equal(stored.shippo_transaction_id, "txn_old");
});

/** Replays with the event_hash uniqueness replaced by `replacement` SQL right before migration 2. */
async function replayWithEventHashIndex(replacement: string) {
  const db = (await migrationFixture()) as Db;
  await replay(db, {
    before: async (name) => {
      if (name !== ISOLATION_MIGRATION) return;
      const constraint = (await db.query<{ conname: string }>(
        `select conname from pg_constraint where conrelid = 'public.shippo_tracking_events'::regclass and contype = 'u'`,
      )).rows;
      for (const { conname } of constraint) await db.exec(`alter table public.shippo_tracking_events drop constraint ${conname}`);
      const indexes = (await db.query<{ indexname: string }>(
        `select indexname from pg_indexes where schemaname = 'public' and tablename = 'shippo_tracking_events' and indexdef ilike '%unique%event_hash%'`,
      )).rows;
      for (const { indexname } of indexes) await db.exec(`drop index public.${indexname}`);
      if (replacement) await db.exec(replacement);
    },
  });
  return db;
}

test("migration 2 fails closed unless event_hash has an ON CONFLICT-usable unique index", { timeout: 600_000 }, async () => {
  for (const [label, replacement] of [
    ["missing", ""],
    ["partial", "create unique index ste_hash_partial on public.shippo_tracking_events (event_hash) where event_hash is not null"],
    ["deferrable", "alter table public.shippo_tracking_events add constraint ste_hash_deferrable unique (event_hash) deferrable"],
    ["composite", "create unique index ste_hash_composite on public.shippo_tracking_events (event_hash, matter_id)"],
  ] as const) {
    await assert.rejects(replayWithEventHashIndex(replacement), /SHIPPO_TRACKING_EVENT_HASH_UNIQUE_INDEX_REQUIRED/, label);
  }
  // A unique index with INCLUDE columns is a valid arbiter and must be accepted.
  const db = await replayWithEventHashIndex(
    "create unique index ste_hash_include on public.shippo_tracking_events (event_hash) include (matter_id)",
  );
  const arbiter = await db.query(
    `insert into public.shippo_tracking_events (event_hash, status) values ('x1', 'TRANSIT'), ('x1', 'TRANSIT') on conflict (event_hash) do nothing returning id`,
  );
  assert.equal(arbiter.rows.length, 1);
});
