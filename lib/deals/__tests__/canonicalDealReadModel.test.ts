import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CANONICAL_DEAL_COLUMNS,
  COMP_CAPABILITY_COLUMNS,
  normalizeDealRow,
  detectConflicts,
  fetchCanonicalDeals,
  DealsSchemaError,
} from "../canonicalDealReadModel";

// 1 + 2 + 3: status controls operational status; stage separate; deal_status fallback-only
test("status controls operational status; stage stays separate; deal_status is fallback-only", () => {
  const n = normalizeDealRow({ status: "in_execution", stage: "won", deal_status: "legacy_x" });
  assert.equal(n.status, "in_execution"); // primary
  assert.equal(n.salesStage, "won"); // separate
  assert.equal(n.legacyDealStatus, "legacy_x");
  // fallback only when status null:
  assert.equal(normalizeDealRow({ status: null, deal_status: "fb" }).status, "fb");
  // stage never used as operational-status fallback:
  assert.equal(normalizeDealRow({ status: null, deal_status: null, stage: "won" }).status, null);
});

// 4: status/deal_status conflict detected
test("status/deal_status conflict is reported (not overwritten)", () => {
  const c = detectConflicts([{ status: "a", deal_status: "b" }, { status: "x", deal_status: "x" }]);
  assert.equal(c.find((f) => f.field === "operationalStatus")?.count, 1);
});

// 5 + 6 + 7: destination primary/fallback + conflict
test("destination_country controls; country is null-only fallback; conflict reported", () => {
  assert.equal(normalizeDealRow({ destination_country: "Italy", country: "Spain" }).destination_country, "Italy");
  assert.equal(normalizeDealRow({ destination_country: null, country: "Spain" }).country, "Spain");
  const c = detectConflicts([{ destination_country: "Italy", country: "Spain" }]);
  assert.equal(c.find((f) => f.field === "destination")?.count, 1);
});

// 8: organization company_name → company fallback
test("company_name controls; company is null-only fallback", () => {
  assert.equal(normalizeDealRow({ company_name: "Acme", company: "Beta" }).company_name, "Acme");
  assert.equal(normalizeDealRow({ company_name: null, company: "Beta" }).company_name, "Beta");
});

// 9: document_type → document fallback
test("document_type controls; document is null-only fallback", () => {
  assert.equal(normalizeDealRow({ document_type: "POA", document: "old" }).document_type, "POA");
  assert.equal(normalizeDealRow({ document_type: null, document: "old" }).document_type, "old");
});

// 10: payment fields map correctly
test("payment fields map correctly", () => {
  const n = normalizeDealRow({ payment_status: "paid", payment_confirmed: true, amount_paid: 1000 });
  assert.equal(n.payment_status, "paid");
  assert.equal(n.payment_confirmed, true);
  assert.equal(n.amount_paid, 1000);
});

// 11: missing complimentary fields → capability unavailable + null comp fields
test("comp fields normalize from raw when present, else null", () => {
  assert.equal(normalizeDealRow({ status: "new" }).payment_disposition, null);
  const n = normalizeDealRow({ status: "new", payment_disposition: "complimentary", verified_revenue: 0, comp_authorized: true, currency: "USD" });
  assert.equal(n.payment_disposition, "complimentary");
  assert.equal(n.comp_authorized, true);
  assert.equal(n.currency, "USD");
});

test("base column list has status+stage+destination; comp columns are a separate list", () => {
  assert.ok(/\bstatus\b/.test(CANONICAL_DEAL_COLUMNS) && /\bstage\b/.test(CANONICAL_DEAL_COLUMNS));
  assert.ok(/destination_country/.test(CANONICAL_DEAL_COLUMNS) && /\bcountry\b/.test(CANONICAL_DEAL_COLUMNS));
  for (const comp of ["payment_disposition", "verified_revenue", "comp_authorized", "currency"]) {
    assert.ok(!new RegExp(comp).test(CANONICAL_DEAL_COLUMNS), `base list must not include ${comp}`);
    assert.ok(new RegExp(comp).test(COMP_CAPABILITY_COLUMNS), `comp list must include ${comp}`);
  }
});

// capability AVAILABLE when the comp-inclusive query succeeds
test("compCapability is available when comp columns select succeeds", async () => {
  const ok = {
    from: () => ({
      select: () => ({
        gte: async () => ({ data: [{ status: "new", deal_status: "old" }], error: null }),
      }),
    }),
  };
  const res = await fetchCanonicalDeals(ok, "2026-01-01T00:00:00Z");
  assert.equal(res.compCapability, "available");
  assert.equal(res.conflicts.find((c) => c.field === "operationalStatus")?.count, 1);
});

// capability UNAVAILABLE when comp select errors but base succeeds
test("compCapability is unavailable when comp columns absent but base works", async () => {
  let call = 0;
  const client = {
    from: () => ({
      select: (cols: string) => ({
        gte: async () => {
          call += 1;
          // First call includes comp columns → error; base-only call → succeeds.
          if (/payment_disposition/.test(cols)) return { data: null, error: { message: "column does not exist" } };
          return { data: [{ status: "new" }], error: null };
        },
      }),
    }),
  };
  const res = await fetchCanonicalDeals(client, "2026-01-01T00:00:00Z");
  assert.equal(res.compCapability, "unavailable");
  assert.ok(call >= 2, "should retry base-only");
});

// schema failure → DealsSchemaError when even base fails
test("fetchCanonicalDeals throws DealsSchemaError when base query also fails", async () => {
  const failing = { from: () => ({ select: () => ({ gte: async () => ({ data: null, error: { message: "x" } }) }) }) };
  await assert.rejects(() => fetchCanonicalDeals(failing, "2026-01-01T00:00:00Z"), DealsSchemaError);
});

// sanitized error
test("DealsSchemaError message is sanitized", () => {
  const src = readFileSync("lib/deals/canonicalDealReadModel.ts", "utf8");
  const thrown = src.match(/new DealsSchemaError\("([^"]*)"\)/)?.[1] ?? "";
  assert.ok(/schema verification required/i.test(thrown));
  assert.ok(!/column|sql|token|key|secret/i.test(thrown));
});

// no writes
test("adapter is read-only (no writes)", () => {
  const src = readFileSync("lib/deals/canonicalDealReadModel.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w));
});

// 16 + 17: Sources #1–#3 consume only the adapter; no direct ambiguous reads
test("Sources #1–#3 consume only the canonical adapter", () => {
  for (const f of [
    "lib/intelligence/enterprise/server/founderMatterSource.ts",
    "lib/intelligence/enterprise/server/founderRevenueSource.ts",
    "lib/intelligence/enterprise/server/founderOrganizationSource.ts",
  ]) {
    const src = readFileSync(f, "utf8");
    assert.ok(/fetchCanonicalDeals/.test(src));
    assert.ok(!/\.from\("deals"\)/.test(src));
  }
});

// conflicts surface as verified_with_limitations
test("loaders surface conflicts as verified_with_limitations", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderMatterSource.ts", "utf8");
  assert.ok(/verified_with_limitations/.test(src));
});

// revenue loader flags complimentary capability unavailable
test("revenue loader flags complimentary capability unavailable", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderRevenueSource.ts", "utf8");
  assert.ok(/compCapability/.test(src) && /complimentary_capability_unavailable/.test(src));
});
