import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildMatterPerformanceSnapshot,
  mapDealsToCanonicalMatterRecords,
  type CanonicalMatterRecord,
} from "../index";

const paid = (o: Partial<CanonicalMatterRecord> = {}): CanonicalMatterRecord => ({
  matterId: "p",
  payment_confirmed: true,
  amount_paid: 1000,
  payment_disposition: "standard_payment",
  ...o,
});

// 1. verified paid evidence contributes revenue
test("verified paid evidence contributes revenue", () => {
  const s = buildMatterPerformanceSnapshot([paid({ matterId: "1", amount_paid: 1500 })]);
  assert.equal(s.verifiedRevenue, 1500);
  assert.equal(s.verifiedMatterVolume, 1);
});

// 2. quote-only (unconfirmed) records do not contribute
test("quote-only / unconfirmed records do not contribute revenue", () => {
  const s = buildMatterPerformanceSnapshot([
    { matterId: "q", payment_confirmed: false, amount_paid: null, payment_disposition: "standard_payment" },
  ]);
  assert.equal(s.verifiedRevenue, 0);
  assert.equal(s.verifiedMatterVolume, 0);
});

// 3. forecasts do not contribute verified revenue
test("forecast is separate and never in verified revenue", () => {
  const s = buildMatterPerformanceSnapshot([paid({ matterId: "1" })]);
  assert.equal(s.forecastRevenue, null);
  assert.equal(s.verifiedRevenue, 1000);
});

// 4 + 5. complimentary stays $0 and excluded from paid count
test("complimentary Matter revenue stays $0 and is excluded from paid count", () => {
  const s = buildMatterPerformanceSnapshot([
    { matterId: "c", payment_confirmed: true, amount_paid: 9999, payment_disposition: "complimentary", comp_authorized: true },
  ]);
  assert.equal(s.verifiedRevenue, 0);
  assert.equal(s.verifiedMatterVolume, 0);
  assert.equal(s.complimentaryMatterVolume, 1);
});

// 6. sample payments excluded
test("sample payments are excluded", () => {
  const s = buildMatterPerformanceSnapshot([paid({ matterId: "1" }), paid({ matterId: "2", amount_paid: 5000, isSample: true })]);
  assert.equal(s.verifiedRevenue, 1000);
  assert.equal(s.sampleExcluded, 1);
});

// 7. unconfirmed payment excluded (explicit)
test("unconfirmed payment is excluded from revenue", () => {
  const s = buildMatterPerformanceSnapshot([paid({ matterId: "1", payment_confirmed: false })]);
  assert.equal(s.verifiedRevenue, 0);
});

// 8. unknown amount contributes nothing (treated as 0, not guessed)
test("unknown amount does not fabricate revenue", () => {
  const s = buildMatterPerformanceSnapshot([{ matterId: "1", payment_confirmed: true, amount_paid: null, payment_disposition: "standard_payment", currency: "USD" }]);
  assert.equal(s.verifiedRevenue, 0);
});

// 9. unsupported/mixed currency is not converted
test("mixed currencies are not converted — verifiedRevenue null with limitation", () => {
  const s = buildMatterPerformanceSnapshot([
    paid({ matterId: "1", amount_paid: 100, currency: "USD" }),
    paid({ matterId: "2", amount_paid: 100, currency: "EUR" }),
  ]);
  assert.equal(s.verifiedRevenue, null);
  assert.equal(s.currency, null);
  assert.ok(s.limitations.some((l) => /currenc/i.test(l)));
});

test("single currency is preserved on the snapshot", () => {
  const s = buildMatterPerformanceSnapshot([paid({ matterId: "1", amount_paid: 100, currency: "USD" })]);
  assert.equal(s.verifiedRevenue, 100);
  assert.equal(s.currency, "USD");
});

// 10. refund/reversal: not confirmed → excluded (canonical: only confirmed counts)
test("refunded/reversed (not confirmed) is excluded", () => {
  const s = buildMatterPerformanceSnapshot([{ matterId: "r", payment_confirmed: false, amount_paid: 500, payment_disposition: "standard_payment" }]);
  assert.equal(s.verifiedRevenue, 0);
});

// 11. inputs not mutated
test("inputs are not mutated", () => {
  const input = Object.freeze([Object.freeze(paid({ matterId: "1" }))]) as CanonicalMatterRecord[];
  const before = JSON.stringify(input);
  buildMatterPerformanceSnapshot(input);
  assert.equal(JSON.stringify(input), before);
});

// mapper: deals → canonical records, unknowns null
test("revenue mapper maps canonical payment columns and keeps unknowns null", () => {
  const recs = mapDealsToCanonicalMatterRecords([
    { deal_id: "d1", payment_confirmed: true, amount_paid: 1200, payment_disposition: "standard_payment", currency: "USD" },
    { id: "d2" },
  ]);
  assert.equal(recs[0].amount_paid, 1200);
  assert.equal(recs[0].currency, "USD");
  assert.equal(recs[1].amount_paid, null);
  assert.equal(recs[1].payment_confirmed, null);
});

// 12 + 13 + 14 + 15. server adapter contracts (source-level)
test("revenue loader is read-only, founder/admin gated, server-only, computed-snapshot only", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderRevenueSource.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w), `no ${w}`);
  // No outbound provider requests (ignore comments; check for actual calls).
  const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.ok(!/\bfetch\(|\baxios|https?:\/\//i.test(code), "no provider calls / webhook replay");
  assert.ok(/resolveServerRole/.test(src) && /FOUNDER_ADMIN_ROLES/.test(src), "founder/admin gated");
  assert.ok(!/user_metadata/.test(src), "no user_metadata authz");
  assert.ok(/buildMatterPerformanceSnapshot/.test(src), "returns computed snapshot");
  const index = readFileSync("lib/intelligence/enterprise/index.ts", "utf8");
  assert.ok(!/server\/founderRevenueSource/.test(index), "server loader not re-exported to client barrel");
});

test("only an explicit safe column list is selected (no wildcard, no raw payload columns)", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderRevenueSource.ts", "utf8");
  const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.ok(!/select\("\*"\)/.test(code), "no wildcard select");
  assert.ok(!/payload|raw_|provider_response|credential/i.test(code), "no raw payload columns selected");
});

// 16 + 17. Matter wiring and Founder Command intact
test("Matter-state wiring and Founder Command remain intact", () => {
  const page = readFileSync("app/dashboard/founder/page.tsx", "utf8");
  assert.ok(/loadFounderMatterStateSnapshot/.test(page), "Source #1 wiring intact");
  assert.ok(/loadFounderRevenueSnapshot/.test(page), "Source #2 wiring added");
  const fc = readFileSync("components/founder/FounderCommandCenter.tsx", "utf8");
  assert.ok(/DAILY_COMMAND_ITEMS/.test(fc) && /EnterpriseIntelligenceSection/.test(fc));
});

// 18. no duplicate revenue engine
test("no duplicate revenue engine — reuses buildMatterPerformanceSnapshot", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderRevenueSource.ts", "utf8");
  assert.ok(!/class\s+\w*Revenue|new RevenueEngine/.test(src));
  assert.ok(/buildMatterPerformanceSnapshot/.test(src), "reuses the canonical read-model builder");
});
