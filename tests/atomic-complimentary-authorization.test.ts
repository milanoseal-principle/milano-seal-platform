import assert from "node:assert/strict";
import fs from "node:fs";
import test, { before as setup, after as teardown } from "node:test";
import type { PGlite } from "@electric-sql/pglite";

// Regression for non-atomic complimentary authorization: the authorization row, the
// canonical Matter (public.deals) and the canonical timeline event were separate writes.
// Runs on the real repository migration chain replayed in order; synthetic rows only.

const migrationFixture = async (): Promise<PGlite> =>
  (await import("../scripts/lib/migration-fixture.mjs" as string) as { migrationFixture: () => Promise<PGlite> }).migrationFixture();

const ACTOR = "00000000-0000-4000-8000-00000000a001";
let db: PGlite;
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

setup(async () => {
  db = await migrationFixture();
  const plan = JSON.parse(fs.readFileSync("supabase/migration-replay-plan.json", "utf8")) as { fresh_database_prerequisites: string[] };
  const files = fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  for (const name of [...plan.fresh_database_prerequisites, ...files.filter((f) => !plan.fresh_database_prerequisites.includes(f))]) {
    await db.exec(fs.readFileSync(`supabase/migrations/${name}`, "utf8"));
  }
  await db.query("insert into auth.users(id, email, raw_app_meta_data) values ($1, 'owner@example.invalid', '{\"role\":\"founder_admin\"}')", [ACTOR]);
});
teardown(async () => db.close());

async function newMatter(amountDue = 450): Promise<string> {
  return (await db.query<{ id: string }>("insert into public.deals(email, amount_due) values ($1, $2) returning id::text", [`client-${++n}@example.invalid`, amountDue])).rows[0].id;
}
const authorization = (matterId: string, id = uuid(), total = 450) => ({
  id, matter_id: matterId, quote_id: null, quote_version: "q-1", original_subtotal: total, original_add_ons: 0, original_total: total,
  discount_amount: total, final_amount_due: 0, currency: "USD", reason_code: "internal_quality_test", reason_detail: "Synthetic acceptance Matter for QA.",
  authorized_by_user_id: ACTOR, authorized_by_role: "founder_admin", authorization_scope: "single_matter", status: "active",
  authorized_at: new Date().toISOString(), audit_event_id: uuid(),
});
const dealPatch = (authId: string, extra: Record<string, unknown> = {}) => ({
  payment_disposition: "complimentary", amount_before_adjustment: 450, complimentary_adjustment_amount: 450, amount_due: 0, amount_paid: 0,
  verified_revenue: 0, wise_payment_id: null, wise_transfer_id: null, payment_confirmed_at: null, comp_authorized: true,
  comp_authorized_by: ACTOR, comp_authorized_at: new Date().toISOString(), comp_reason_code: "internal_quality_test",
  comp_reason_detail: "Synthetic acceptance Matter for QA.", comp_authorization_id: authId, ...extra,
});

async function asService<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec("set role service_role");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
const authorize = (auth: Record<string, unknown>, patch: Record<string, unknown>) =>
  asService(async () => (await db.query<{ authorization_id: string; matter_event_id: string; already_authorized: boolean }>(
    "select * from public.authorize_complimentary_matter($1::jsonb, $2::jsonb, 'owner@example.invalid')", [JSON.stringify(auth), JSON.stringify(patch)])).rows[0]);
const revoke = (matterId: string, authId: string, reason = "Synthetic revocation for QA.") =>
  asService(async () => (await db.query<{ revoked_at: string; matter_event_id: string; already_revoked: boolean }>(
    "select * from public.revoke_complimentary_matter($1, $2, $3, $4, 'owner@example.invalid')", [matterId, authId, reason, ACTOR])).rows[0]);

async function state(matterId: string) {
  const deal = (await db.query<Record<string, unknown>>("select payment_disposition, amount_due::float8 amount_due, amount_paid::float8 amount_paid, verified_revenue::float8 verified_revenue, comp_authorized, comp_authorization_id::text, payment_confirmed, payment_status, payment_settlement_status, payment_confirmed_at, wise_payment_id from public.deals where id = $1", [matterId])).rows[0];
  const auths = (await db.query<{ id: string; status: string }>("select id::text, status from public.complimentary_authorizations where matter_id = $1 order by created_at", [matterId])).rows;
  const events = (await db.query<{ event_type: string; metadata: Record<string, unknown> }>("select event_type, metadata from public.matter_events where matter_id = $1 order by created_at", [matterId])).rows;
  return { deal, auths, events };
}

async function withFailingTrigger(table: string, fn: () => Promise<unknown>) {
  await db.exec(`create or replace function public.__fail_write() returns trigger language plpgsql as $$ begin raise exception 'SYNTHETIC_WRITE_FAILURE'; end $$;
    create trigger __fail_write before insert or update on public.${table} for each row execute function public.__fail_write();`);
  try {
    await assert.rejects(fn(), /SYNTHETIC_WRITE_FAILURE/);
  } finally {
    await db.exec(`drop trigger __fail_write on public.${table}; drop function public.__fail_write();`);
  }
}

test("authorization, Matter zero state and canonical event commit together", async () => {
  const matter = await newMatter();
  const auth = authorization(matter);
  const result = await authorize(auth, dealPatch(auth.id));
  assert.equal(result.authorization_id, auth.id);
  assert.equal(result.already_authorized, false);
  const s = await state(matter);
  assert.deepEqual(s.auths, [{ id: auth.id, status: "active" }]);
  assert.equal(s.events.length, 1);
  assert.equal(s.events[0].event_type, "COMPLIMENTARY_AUTHORIZATION_APPROVED");
  assert.equal(s.events[0].metadata.authorization_id, auth.id);
  assert.deepEqual(
    [s.deal.payment_disposition, s.deal.amount_due, s.deal.amount_paid, s.deal.verified_revenue, s.deal.comp_authorized, s.deal.comp_authorization_id],
    ["complimentary", 0, 0, 0, true, auth.id],
  );
});

test("never fabricates payment or Wise settlement", async () => {
  const matter = await newMatter();
  const before = (await state(matter)).deal;
  const auth = authorization(matter);
  await authorize(auth, dealPatch(auth.id));
  const after = (await state(matter)).deal;
  for (const field of ["payment_confirmed", "payment_status", "payment_settlement_status"]) assert.deepEqual(after[field], before[field], `${field} untouched`);
  assert.equal(after.payment_confirmed_at, null);
  assert.equal(after.wise_payment_id, null);
  for (const forged of [{ payment_confirmed: true }, { payment_status: "paid" }, { payment_settlement_status: "verified" }, { amount_paid: 450 }, { verified_revenue: 450 }, { amount_due: 1 }, { wise_payment_id: "w-1" }]) {
    const m = await newMatter();
    const a = authorization(m);
    await assert.rejects(authorize(a, dealPatch(a.id, forged)), /COMPLIMENTARY_MATTER_STATE_INVALID/, JSON.stringify(forged));
    assert.deepEqual((await state(m)).auths, [], "nothing written");
  }
});

test("a failed audit event or Matter write rolls the whole authorization back", async () => {
  for (const table of ["matter_events", "deals", "complimentary_authorizations"]) {
    const matter = await newMatter();
    const before = await state(matter);
    const auth = authorization(matter);
    await withFailingTrigger(table, () => authorize(auth, dealPatch(auth.id)));
    assert.deepEqual(await state(matter), before, `${table} failure: no partial state`);
  }
});

test("repeat is idempotent; a second authorization is refused; no duplicate events", async () => {
  const matter = await newMatter();
  const auth = authorization(matter);
  const first = await authorize(auth, dealPatch(auth.id));
  const again = await authorize(auth, dealPatch(auth.id));
  assert.equal(again.already_authorized, true);
  assert.equal(again.matter_event_id, first.matter_event_id, "returns the original event");
  const other = authorization(matter);
  await assert.rejects(authorize(other, dealPatch(other.id)), /COMPLIMENTARY_ALREADY_AUTHORIZED/);
  const s = await state(matter);
  assert.equal(s.auths.length, 1);
  assert.equal(s.events.length, 1);
});

test("identity binding: unknown Matter and a patch bound to another authorization are refused", async () => {
  const ghost = authorization("00000000-0000-4000-8000-0000000fffff");
  await assert.rejects(authorize(ghost, dealPatch(ghost.id)), /COMPLIMENTARY_MATTER_NOT_FOUND/);
  const matter = await newMatter();
  const auth = authorization(matter);
  await assert.rejects(authorize(auth, dealPatch(uuid())), /COMPLIMENTARY_MATTER_STATE_INVALID/);
  assert.deepEqual((await state(matter)).auths, []);
});

test("revocation is atomic, restores the original amount due, is idempotent and is Matter-bound", async () => {
  const matter = await newMatter();
  const auth = authorization(matter);
  await authorize(auth, dealPatch(auth.id));
  const otherMatter = await newMatter();
  await assert.rejects(revoke(otherMatter, auth.id), /COMPLIMENTARY_AUTHORIZATION_NOT_FOUND/, "cross-Matter revocation refused");
  await withFailingTrigger("matter_events", () => revoke(matter, auth.id));
  assert.equal((await state(matter)).deal.comp_authorized, true, "failed revocation changed nothing");
  const first = await revoke(matter, auth.id);
  const again = await revoke(matter, auth.id);
  assert.equal(again.already_revoked, true);
  assert.equal(again.matter_event_id, first.matter_event_id);
  const s = await state(matter);
  assert.deepEqual([s.deal.payment_disposition, s.deal.amount_due, s.deal.comp_authorized], ["standard_payment", 450, false]);
  assert.deepEqual(s.auths, [{ id: auth.id, status: "revoked" }]);
  assert.deepEqual(s.events.map((e) => e.event_type), ["COMPLIMENTARY_AUTHORIZATION_APPROVED", "COMPLIMENTARY_AUTHORIZATION_REVOKED"]);
});

test("only the service role may execute either function", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(db.query("select * from public.authorize_complimentary_matter('{}'::jsonb, '{}'::jsonb, 'x')"), /permission denied/, role);
      await assert.rejects(db.query("select * from public.revoke_complimentary_matter(null, null, 'x', null, 'x')"), /permission denied/, role);
    } finally {
      await db.exec("reset role");
    }
  }
});

test("the server flow writes only through the atomic functions", () => {
  const src = fs.readFileSync("lib/payments/complimentary-server.ts", "utf8").replace(/\/\/.*$/gm, "");
  assert.match(src, /rpc\("authorize_complimentary_matter"/);
  assert.match(src, /rpc\("revoke_complimentary_matter"/);
  assert.doesNotMatch(src, /from\("complimentary_authorizations"\)\.(insert|update|upsert|delete)/, "no separate authorization write");
  assert.doesNotMatch(src, /from\("deals"\)\.(insert|update|upsert|delete)/, "no separate Matter write");
  assert.match(src, /COMPLIMENTARY_AUTHORIZATION_NOT_COMMITTED/, "success requires the committed event id");
});
