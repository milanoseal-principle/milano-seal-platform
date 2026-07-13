import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CANONICAL_DEAL_COLUMNS,
  normalizeDealRow,
  fetchCanonicalDeals,
  DealsSchemaError,
} from "../canonicalDealReadModel";

// 1. adapter maps committed schema fields correctly
test("normalizes migration-confirmed columns to stable app fields", () => {
  const n = normalizeDealRow({
    id: "x",
    deal_id: "d1",
    deal_status: "completed",
    destination_country: "Italy",
    company_name: "Acme Law",
    document_type: "POA",
    created_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-02T00:00:00Z",
    payment_status: "paid",
    payment_disposition: "standard_payment",
    amount_paid: 1000,
    verified_revenue: 1000,
    comp_authorized: false,
  });
  // 2 + 3: status/country map from the controlling DB fields
  assert.equal(n.status, "completed");
  assert.equal(n.country, "Italy");
  assert.equal(n.destination_country, "Italy");
  // 4: organization name maps from company_name
  assert.equal(n.company_name, "Acme Law");
  // payment_confirmed derived from payment_status='paid'
  assert.equal(n.payment_confirmed, true);
  assert.equal(n.currency, null); // no per-row currency column
});

test("payment_confirmed is false when payment_status is not 'paid', null when absent", () => {
  assert.equal(normalizeDealRow({ payment_status: "unpaid" }).payment_confirmed, false);
  assert.equal(normalizeDealRow({}).payment_confirmed, null);
});

// column list is migration-confirmed, no ambiguous names, no wildcard
test("canonical column list uses deal_status/destination_country, not status/country", () => {
  assert.ok(/deal_status/.test(CANONICAL_DEAL_COLUMNS));
  assert.ok(/destination_country/.test(CANONICAL_DEAL_COLUMNS));
  assert.ok(!/\bstatus\b(?!_)/.test(CANONICAL_DEAL_COLUMNS.replace(/deal_status|payment_status/g, "")));
  assert.ok(!/\bcountry\b/.test(CANONICAL_DEAL_COLUMNS.replace(/destination_country/g, "")));
  assert.ok(!/\*/.test(CANONICAL_DEAL_COLUMNS));
});

// 8: schema/query failure throws DealsSchemaError
test("fetchCanonicalDeals throws DealsSchemaError on query error", async () => {
  const failing = { from: () => ({ select: () => ({ gte: async () => ({ data: null, error: { message: "column does not exist" } }) }) }) };
  await assert.rejects(() => fetchCanonicalDeals(failing, "2026-01-01T00:00:00Z"), DealsSchemaError);
});

test("fetchCanonicalDeals returns normalized rows on success", async () => {
  const ok = {
    from: () => ({
      select: () => ({
        gte: async () => ({ data: [{ deal_id: "d1", deal_status: "new", destination_country: "Spain", company_name: "Beta" }], error: null }),
      }),
    }),
  };
  const rows = await fetchCanonicalDeals(ok, "2026-01-01T00:00:00Z");
  assert.equal(rows[0].status, "new");
  assert.equal(rows[0].country, "Spain");
});

test("fetchCanonicalDeals returns [] (not error) when data is empty", async () => {
  const empty = { from: () => ({ select: () => ({ gte: async () => ({ data: [], error: null }) }) }) };
  const rows = await fetchCanonicalDeals(empty, "2026-01-01T00:00:00Z");
  assert.deepEqual(rows, []);
});

// 5 + 6: all three loaders consume the adapter; none selects ambiguous fields
test("all three enterprise loaders consume the canonical adapter", () => {
  for (const f of [
    "lib/intelligence/enterprise/server/founderMatterSource.ts",
    "lib/intelligence/enterprise/server/founderRevenueSource.ts",
    "lib/intelligence/enterprise/server/founderOrganizationSource.ts",
  ]) {
    const src = readFileSync(f, "utf8");
    assert.ok(/fetchCanonicalDeals/.test(src), `${f} must use fetchCanonicalDeals`);
    assert.ok(!/\.from\("deals"\)/.test(src), `${f} must not select deals directly`);
  }
});

// 8 + 9: loaders map DealsSchemaError → unavailable (no fake zeros)
test("loaders map schema failure to unavailable, not insufficient_evidence", () => {
  for (const f of [
    "lib/intelligence/enterprise/server/founderMatterSource.ts",
    "lib/intelligence/enterprise/server/founderRevenueSource.ts",
    "lib/intelligence/enterprise/server/founderOrganizationSource.ts",
  ]) {
    const src = readFileSync(f, "utf8");
    assert.ok(/DealsSchemaError/.test(src) && /unavailableSnapshot/.test(src), `${f} must surface unavailable`);
    assert.ok(/canonical_source_unavailable/.test(src) || /evidenceStatus: "unavailable"/.test(src));
  }
});

// 10: schema errors are sanitized (no SQL/secret detail)
test("DealsSchemaError message is sanitized (no SQL/column detail)", () => {
  const src = readFileSync("lib/deals/canonicalDealReadModel.ts", "utf8");
  const thrown = src.match(/new DealsSchemaError\("([^"]*)"\)/)?.[1] ?? "";
  assert.ok(/schema verification required/i.test(thrown));
  assert.ok(!/select|column|sql|token|key/i.test(thrown.replace(/schema/i, "")));
});

// 11 + 12 + 13: adapter is read-only, no protected semantics
test("canonical adapter is read-only (no writes)", () => {
  const src = readFileSync("lib/deals/canonicalDealReadModel.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w));
});
