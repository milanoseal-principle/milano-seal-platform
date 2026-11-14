import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";
import { clientFirstName, loadPartnerReferrals, partnerSafeCommissionStatus, partnerSafeMatterStatus } from "@/lib/alliance/partnerReferrals";

// The Alliance referral history (/alliance/referrals and /alliance/matters) selected
// client_name, destination_country, document_type, referral_status, commission_status and
// submitted_at from public.referral_ledger. None of those columns exist there (P12 hosted catalog
// 2026-11-14 and the repository schema), so the pages always showed nothing. The loader now reads
// attribution from referral_ledger, display fields from the canonical Matter (deals) and commission
// review status from payout_reviews, scoped to one partner and projected to partner-safe fields.

const PARTNER = "10000000-0000-4000-8000-000000000001";
const OTHER = "10000000-0000-4000-8000-000000000002";
const M1 = "20000000-0000-4000-8000-000000000001";
const M2 = "20000000-0000-4000-8000-000000000002";

type Call = { table: string; select: string; filters: Array<[string, string, unknown]> };
type Result = { data: unknown; error: unknown };

function fakeDb(results: Record<string, Result>) {
  const calls: Call[] = [];
  const db = {
    from(table: string) {
      const call: Call = { table, select: "", filters: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      builder.select = (cols: string) => { call.select = cols; return builder; };
      builder.eq = (col: string, value: unknown) => { call.filters.push(["eq", col, value]); return builder; };
      builder.in = (col: string, value: unknown) => { call.filters.push(["in", col, value]); return builder; };
      builder.order = () => builder;
      builder.limit = () => builder;
      builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve, reject);
      return builder;
    },
  };
  return { db: db as unknown as SupabaseClient, calls };
}

test("every column the loader reads exists in the replayed canonical schema", async () => {
  const files = fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  const db = await isolatedCanonicalDatabase(files);
  try {
    const source = fs.readFileSync("lib/alliance/partnerReferrals.ts", "utf8");
    const selects = [...source.matchAll(/\.from\("(\w+)"\)\s*\.select\("([^"]+)"\)/g)].map((m) => ({ table: m[1], columns: m[2].split(",").map((c) => c.trim()) }));
    assert.deepEqual(selects.map((s) => s.table).sort(), ["deals", "payout_reviews", "referral_ledger"]);
    for (const { table, columns } of selects) {
      const present = new Set((await db.query<{ c: string }>("select column_name c from information_schema.columns where table_schema = 'public' and table_name = $1", [table])).rows.map((r) => r.c));
      for (const column of columns) assert.ok(present.has(column), `${table}.${column} exists`);
    }
    const ledger = new Set((await db.query<{ c: string }>("select column_name c from information_schema.columns where table_schema = 'public' and table_name = 'referral_ledger'")).rows.map((r) => r.c));
    for (const missing of ["client_name", "referral_status", "commission_status", "submitted_at"]) assert.ok(!ledger.has(missing), `referral_ledger has no ${missing}`);
  } finally {
    await db.close();
  }
});

test("pages no longer select display columns from referral_ledger", () => {
  for (const page of ["app/alliance/referrals/page.tsx", "app/alliance/matters/page.tsx"]) {
    const source = fs.readFileSync(page, "utf8");
    assert.doesNotMatch(source, /from\("referral_ledger"\)/, page);
    assert.match(source, /loadPartnerReferrals\(/, page);
    assert.match(source, /could not be loaded/, `${page} reports a failed read instead of an empty list`);
  }
});

test("reads are scoped to the verified partner and joined to the canonical Matter", async () => {
  const { db, calls } = fakeDb({
    referral_ledger: { data: [
      { id: "L1", matter_id: M1, captured_at: "2026-11-14T10:00:00Z" },
      { id: "L2", matter_id: M2, captured_at: "2026-11-13T10:00:00Z" },
    ], error: null },
    deals: { data: [
      { id: M1, client_name: "Ada Lovelace", destination_country: "Italy", document_type: "power_of_attorney", status: "awaiting_payment" },
      { id: M2, client_name: "Grace", destination_country: "Spain", document_type: "diploma", status: "apostille_processing" },
    ], error: null },
    payout_reviews: { data: [
      { referral_ledger_id: "L1", review_status: "pending_review", created_at: "2026-11-14T11:00:00Z" },
      { referral_ledger_id: "L1", review_status: "approved", created_at: "2026-11-14T12:00:00Z" },
    ], error: null },
  });
  const result = await loadPartnerReferrals(PARTNER, db);
  assert.equal(result.unavailable, false);
  assert.deepEqual(result.referrals, [
    { id: "L1", client_name: "Ada", destination_country: "Italy", document_type: "power_of_attorney", referral_status: "under_review", commission_status: "APPROVED", submitted_at: "2026-11-14T10:00:00Z" },
    { id: "L2", client_name: "Grace", destination_country: "Spain", document_type: "diploma", referral_status: "apostille", commission_status: "PENDING_REVIEW", submitted_at: "2026-11-13T10:00:00Z" },
  ]);
  const byTable = Object.fromEntries(calls.map((c) => [c.table, c]));
  assert.deepEqual(byTable.referral_ledger.filters, [["eq", "partner_id", PARTNER]]);
  assert.deepEqual(byTable.deals.filters, [["in", "id", [M1, M2]]]);
  assert.deepEqual(byTable.payout_reviews.filters, [["eq", "partner_id", PARTNER], ["in", "referral_ledger_id", ["L1", "L2"]]]);
  for (const call of calls) assert.doesNotMatch(call.select, /email|phone|notes|amount|payment|wise|internal/i, `${call.table} selects partner-safe columns only`);
  assert.ok(!JSON.stringify(result).includes(OTHER));
});

test("no partner, no rows; a failed read is reported, never shown as an empty history", async () => {
  assert.deepEqual(await loadPartnerReferrals(null, fakeDb({}).db), { referrals: [], unavailable: false });
  assert.deepEqual(await loadPartnerReferrals(PARTNER, fakeDb({ referral_ledger: { data: [], error: null } }).db), { referrals: [], unavailable: false });
  assert.deepEqual(await loadPartnerReferrals(PARTNER, fakeDb({ referral_ledger: { data: null, error: { message: "boom" } } }).db), { referrals: [], unavailable: true });
  const matterFailure = fakeDb({
    referral_ledger: { data: [{ id: "L1", matter_id: M1, captured_at: "2026-11-14T10:00:00Z" }], error: null },
    deals: { data: null, error: { message: "boom" } },
  });
  assert.deepEqual(await loadPartnerReferrals(PARTNER, matterFailure.db), { referrals: [], unavailable: true });
});

test("partner-safe projection hides payment and internal states and client surnames", () => {
  assert.equal(partnerSafeMatterStatus("awaiting_payment"), "under_review");
  assert.equal(partnerSafeMatterStatus("payment_confirmed"), "in_progress");
  assert.equal(partnerSafeMatterStatus("shipped"), "in_transit");
  assert.equal(partnerSafeMatterStatus("something_internal"), "under_review");
  assert.equal(partnerSafeMatterStatus(null), "under_review");
  assert.equal(partnerSafeCommissionStatus("paid"), "PAID");
  assert.equal(partnerSafeCommissionStatus(undefined), "PENDING_REVIEW");
  assert.equal(clientFirstName("  Ada  Lovelace "), "Ada");
  assert.equal(clientFirstName(""), null);
  assert.equal(clientFirstName(null), null);
});
