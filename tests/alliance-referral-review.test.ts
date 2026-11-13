import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";
import { partnerIdForReferralCode } from "@/lib/alliance/partnerContext";
import { recordPartnerReferralAttribution, referralAttributionId, reviewPartnerReferral, submitPartnerReferral } from "@/lib/alliance/referralLeads";

// B04: a partner referral becomes at most one Matter, through the governed transition, with one
// attribution row. Fixtures are synthetic and run against the replayed repository schema.

type Db = Awaited<ReturnType<typeof isolatedCanonicalDatabase>>;
const migrations = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();

function client(db: Db, opts: { failInsertInto?: string; failRead?: string } = {}): SupabaseClient {
  const value = (v: unknown) => (v !== null && typeof v === "object" && !(v instanceof Date) ? JSON.stringify(v) : v);
  const from = (table: string) => {
    const state = { op: "select", cols: "*", where: [] as string[], params: [] as unknown[], row: null as Record<string, unknown> | null };
    const param = (v: unknown) => { state.params.push(value(v)); return `$${state.params.length}`; };
    const run = async () => {
      if (opts.failRead === table && state.op === "select") return { data: null, error: { message: "boom" } };
      if (opts.failInsertInto === table && state.op === "insert") return { data: null, error: { message: "boom" } };
      try {
        const where = state.where.length ? ` where ${state.where.join(" and ")}` : "";
        const keys = state.row ? Object.keys(state.row) : [];
        const sql = state.op === "insert" ? `insert into public.${table}(${keys.join(",")}) values(${keys.map((k) => param(state.row![k])).join(",")}) returning *`
          : state.op === "update" ? `update public.${table} set ${keys.map((k) => `${k}=${param(state.row![k])}`).join(",")}${where} returning *`
          : `select ${state.cols} from public.${table}${where}`;
        return { data: (await db.query<Record<string, unknown>>(sql, state.params)).rows, error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message, code: (error as { code?: string }).code } };
      }
    };
    // Explicitly typed: a self-referential inferred builder makes the type-checker explode.
    const api: Record<string, unknown> = {};
    api.select = (cols?: string) => { if (state.op === "select" && cols) state.cols = cols; return api; };
    api.insert = (row: Record<string, unknown>) => { state.op = "insert"; state.row = row; return api; };
    api.update = (row: Record<string, unknown>) => { state.op = "update"; state.row = row; return api; };
    api.eq = (col: string, v: unknown) => { state.where.push(`${col}=${param(v)}`); return api; };
    api.is = (col: string) => { state.where.push(`${col} is null`); return api; };
    api.ilike = (col: string, v: string) => { state.where.push(`${col} ilike ${param(v)}`); return api; };
    api.maybeSingle = async () => { const r = await run(); return r.error ? r : { data: r.data![0] ?? null, error: null }; };
    api.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => run().then(resolve, reject);
    return api;
  };
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    try {
      return { data: (await db.query(`select * from public.${fn}($1,$2)`, [args.p_lead_id, args.p_actor_id])).rows, error: null };
    } catch (error) {
      return { data: null, error: { message: (error as Error).message, code: (error as { code?: string }).code } };
    }
  };
  return { from, rpc } as unknown as SupabaseClient;
}

async function seed(db: Db) {
  const ids = { coordinator: randomUUID(), partnerUser: randomUUID() };
  await db.query(`insert into auth.users(id, raw_app_meta_data) values($1, '{"role":"execution_coordinator"}'), ($2, '{"role":"alliance_partner"}')`, [ids.coordinator, ids.partnerUser]);
  const op = async (code: string, extra: string) => (await db.query<{ id: string }>(`insert into public.operators(user_id, email, role, referral_code${extra ? ", is_active" : ""}) values($1,$2,'alliance_partner',$3${extra}) returning id`, [code === "MSA-ACTIVE" ? ids.partnerUser : null, `${code.toLowerCase()}@example.invalid`, code])).rows[0].id;
  return { ...ids, partner: await op("MSA-ACTIVE", ""), inactive: await op("MSA-OFF", ", false") };
}
const referral = (c: SupabaseClient, partner: string, name: string | null = "Synthetic Client") =>
  submitPartnerReferral(c, { client_name: name, client_email: "client@example.invalid", destination_country: "Italy", document_type: "Power of Attorney", matter_type: "international", referral_code: "MSA-ACTIVE", context: {} }, partner);
const count = async (db: Db, sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows.length;

test("referral codes: a forged, wildcard or inactive partner's code attributes to no one", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    assert.equal(await partnerIdForReferralCode("msa-active", c), s.partner);
    for (const forged of ["MSA-ACTIV", "MSA-ACTIVE%", "%", "MSA_ACTIVE", "' or 1=1 --", "", "MSA-OFF"]) assert.equal(await partnerIdForReferralCode(forged, c), null, forged);
    await assert.rejects(() => partnerIdForReferralCode("MSA-ACTIVE", client(db, { failRead: "operators" })), /ALLIANCE_IDENTITY_UNAVAILABLE/, "a read failure is not 'no partner'");
  } finally { await db.close(); }
});

test("conversion: one referral becomes exactly one unpaid Matter with one attribution, even when converted concurrently", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    const lead = await referral(c, s.partner);
    const convert = () => reviewPartnerReferral(c, { id: lead.id, action: "convert", actorId: s.coordinator, canConvert: true });
    const results = await Promise.all([convert(), convert(), convert()]);
    assert.ok(results.every((r) => r.ok && r.status === 200 && r.attribution === "RECORDED"), JSON.stringify(results));
    const matterIds = new Set(results.map((r) => (r.ok ? r.matterId : null)));
    assert.equal(matterIds.size, 1, "every attempt returns the same Matter");
    const matterId = [...matterIds][0] as string;
    assert.equal(results.filter((r) => r.ok && r.duplicate === false).length, 1, "exactly one attempt created it");
    assert.equal(await count(db, "select 1 from public.deals where internal_notes::text like '%' || $1 || '%'", [lead.id]), 1);
    assert.equal(await count(db, "select 1 from public.referral_ledger where matter_id=$1", [matterId]), 1);
    const ledger = (await db.query<{ id: string; partner_id: string; source_type: string }>("select id, partner_id, source_type from public.referral_ledger where matter_id=$1", [matterId])).rows[0];
    assert.deepEqual(ledger, { id: referralAttributionId(lead.id, s.partner), partner_id: s.partner, source_type: "partner_link" });

    // Payment and scheduling gates are untouched: the new Matter is unpaid and under review.
    const matter = (await db.query<Record<string, unknown>>("select * from public.deals where id=$1", [matterId])).rows[0];
    assert.equal(matter.payment_status, "unpaid");
    assert.equal(matter.payment_confirmed, false);
    assert.equal(Number(matter.amount_paid), 0);
    assert.equal(matter.status, "intake_received");
    assert.notEqual(evaluatePaymentGate(matter as unknown as Parameters<typeof evaluatePaymentGate>[0]), "PAYMENT_CONFIRMED");

    // A converted referral cannot be re-reviewed.
    for (const action of ["accept", "reject"]) assert.deepEqual(await reviewPartnerReferral(c, { id: lead.id, action, actorId: s.coordinator, canConvert: true }), { ok: false, status: 409, error: "REFERRAL_ALREADY_CONVERTED" });
  } finally { await db.close(); }
});

test("attribution: the deterministic row id makes a racing second insert a duplicate, not a second row", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    const lead = await referral(c, s.partner);
    const matter = randomUUID();
    // Simulate the race: the row is written between the existence check and the insert.
    const racing = client(db);
    const original = racing.from.bind(racing);
    let raced = false;
    (racing as unknown as { from: (t: string) => unknown }).from = (table: string) => {
      const api = original(table) as unknown as Record<string, (...a: unknown[]) => unknown>;
      if (table === "referral_ledger" && !raced) {
        const insert = api.insert;
        api.insert = (row: unknown) => {
          raced = true;
          const pending = db.query("insert into public.referral_ledger(id, matter_id, partner_id, source_type) values($1,$2,$3,'partner_link')", [referralAttributionId(lead.id, s.partner), matter, s.partner]);
          const next = insert(row) as Record<string, unknown>;
          const then = next.then as (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => unknown;
          next.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => pending.then(() => then(res, rej));
          return next;
        };
      }
      return api;
    };
    assert.deepEqual(await recordPartnerReferralAttribution(racing, lead.id, matter), { recorded: true, duplicate: true });
    assert.equal(await count(db, "select 1 from public.referral_ledger where matter_id=$1", [matter]), 1);
    assert.match(referralAttributionId(lead.id, s.partner), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(referralAttributionId(lead.id, s.partner), referralAttributionId(lead.id, s.inactive));
  } finally { await db.close(); }
});

test("authority: partners and unprivileged operators cannot create Matters; the database refuses even if the route check is bypassed", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    const lead = await referral(c, s.partner);
    assert.deepEqual(await reviewPartnerReferral(c, { id: lead.id, action: "convert", actorId: s.coordinator, canConvert: false }), { ok: false, status: 403, error: "FORBIDDEN" });
    // Role escalation: a partner's user id with the route check forced open is still refused by the function.
    assert.deepEqual(await reviewPartnerReferral(c, { id: lead.id, action: "convert", actorId: s.partnerUser, canConvert: true }), { ok: false, status: 403, error: "FORBIDDEN" });
    assert.deepEqual(await reviewPartnerReferral(c, { id: lead.id, action: "convert", actorId: randomUUID(), canConvert: true }), { ok: false, status: 403, error: "FORBIDDEN" });
    assert.equal(await count(db, "select 1 from public.deals"), 0);
    assert.equal(await count(db, "select 1 from public.referral_ledger"), 0);

    const unauthenticated = await requireOperatorApiAccess({ getUser: async () => null, resolveRole: async () => null } as unknown as Parameters<typeof requireOperatorApiAccess>[0]);
    assert.equal(unauthenticated.ok, false);
    if (!unauthenticated.ok) assert.equal(unauthenticated.response.status, 401);
    const partnerSession = await requireOperatorApiAccess({ getUser: async () => ({ id: s.partnerUser }), resolveRole: async () => "alliance_partner" } as unknown as Parameters<typeof requireOperatorApiAccess>[0]);
    if (!partnerSession.ok) assert.equal(partnerSession.response.status, 403); else assert.fail("a partner is not an operator");
    const route = fs.readFileSync("app/api/alliance/referrals/review/route.ts", "utf8");
    assert.ok(route.indexOf("requireOperatorApiAccess()") < route.indexOf("req.json()"), "authenticated before the body is read");
    assert.match(route, /actorId: access\.userId, canConvert: canPerformProtectedMatterTransition\(access\.role\)/);
  } finally { await db.close(); }
});

test("review: reject blocks conversion; accept allows it; invalid input and failures never create a Matter", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    const review = (id: unknown, action: unknown, db2: SupabaseClient = c) => reviewPartnerReferral(db2, { id, action, actorId: s.coordinator, canConvert: true });

    const rejected = await referral(c, s.partner);
    assert.deepEqual(await review(rejected.id, "reject"), { ok: true, status: 200, action: "reject" });
    assert.deepEqual(await review(rejected.id, "convert"), { ok: false, status: 409, error: "REFERRAL_REJECTED" });
    assert.deepEqual(await review(rejected.id, "accept"), { ok: true, status: 200, action: "accept" });
    const reviewed = (await db.query<{ details: Record<string, unknown> }>("select details from public.sales_leads where id=$1", [rejected.id])).rows[0].details;
    assert.equal(reviewed.review_status, "accepted");
    assert.equal(reviewed.reviewed_by, s.coordinator);
    assert.equal(reviewed.partner_id, s.partner, "review never rewrites attribution");
    const converted = await review(rejected.id, "convert");
    assert.ok(converted.ok && converted.attribution === "RECORDED");

    assert.deepEqual(await review("not-a-uuid", "convert"), { ok: false, status: 400, error: "INVALID_REFERRAL_ID" });
    assert.deepEqual(await review(rejected.id, "delete"), { ok: false, status: 400, error: "UNKNOWN_ACTION" });
    assert.deepEqual(await review(randomUUID(), "convert"), { ok: false, status: 404, error: "REFERRAL_NOT_FOUND" });
    // A lead of another type is not a referral, whatever its id.
    const other = (await db.query<{ id: string }>("insert into public.sales_leads(full_name, email, lead_type, source_route) values('X','x@example.invalid','pricing_request','/pricing') returning id")).rows[0].id;
    assert.deepEqual(await review(other, "convert"), { ok: false, status: 404, error: "REFERRAL_NOT_FOUND" });

    // Failed conversion: no client name, so the governed transition refuses and nothing is created.
    const before = await count(db, "select 1 from public.deals");
    const nameless = await referral(c, s.partner, null);
    assert.deepEqual(await review(nameless.id, "convert"), { ok: false, status: 409, error: "LEAD_CONVERSION_FAILED" });
    assert.deepEqual(await review(nameless.id, "convert", client(db, { failRead: "sales_leads" })), { ok: false, status: 503, error: "REFERRALS_UNAVAILABLE" });
    assert.equal(await count(db, "select 1 from public.deals"), before);

    // Attribution not stored: the Matter exists, the caller is told, and a retry records it once.
    const lead = await referral(c, s.partner);
    const partial = await review(lead.id, "convert", client(db, { failInsertInto: "referral_ledger" }));
    assert.ok(partial.ok && partial.status === 202 && partial.attribution === "NOT_RECORDED_RETRY" && partial.matterId);
    const retry = await review(lead.id, "convert");
    assert.ok(retry.ok && retry.status === 200 && retry.duplicate === true && retry.matterId === (partial.ok ? partial.matterId : null));
    assert.equal(await count(db, "select 1 from public.referral_ledger where matter_id=$1", [retry.ok ? retry.matterId : null]), 1);

    await assert.rejects(() => submitPartnerReferral(client(db, { failInsertInto: "sales_leads" }), { client_email: "c@example.invalid", destination_country: "X", document_type: "Y", matter_type: "Z", context: {} }, s.partner), /REFERRAL_NOT_STORED/);
  } finally { await db.close(); }
});
