import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildMatterPerformanceSnapshot,
  buildOrganizationPerformanceSnapshot,
  buildVerticalPerformanceSnapshot,
  buildRelationshipNetworkSnapshot,
  buildIntegrationReliabilitySnapshot,
  buildCapacitySnapshot,
  buildFounderExecutiveSnapshot,
  type CanonicalMatterRecord,
} from "../index";

const paid: CanonicalMatterRecord = {
  matterId: "m1",
  organizationId: "org1",
  vertical: "maritime",
  deal_status: "completed",
  payment_confirmed: true,
  amount_paid: 1000,
  payment_disposition: "standard_payment",
};
const comp: CanonicalMatterRecord = {
  matterId: "m2",
  organizationId: "org1",
  vertical: "maritime",
  deal_status: "scheduled",
  payment_confirmed: false,
  amount_paid: 0,
  payment_disposition: "complimentary",
  comp_authorized: true,
};
const sample: CanonicalMatterRecord = {
  matterId: "m3",
  organizationId: "org9",
  payment_confirmed: true,
  amount_paid: 5000,
  payment_disposition: "standard_payment",
  isSample: true,
};

// 1. snapshots never mutate inputs
test("snapshots never mutate inputs", () => {
  const input = Object.freeze([Object.freeze({ ...paid }), Object.freeze({ ...comp })]) as CanonicalMatterRecord[];
  const before = JSON.stringify(input);
  buildMatterPerformanceSnapshot(input);
  buildOrganizationPerformanceSnapshot(input);
  buildRelationshipNetworkSnapshot(input);
  assert.equal(JSON.stringify(input), before);
});

// 2. verified revenue excludes forecasts
test("verified revenue excludes forecasts (forecast is a separate null field)", () => {
  const s = buildMatterPerformanceSnapshot([paid]);
  assert.equal(s.verifiedRevenue, 1000);
  assert.equal(s.forecastRevenue, null);
});

// 3. complimentary revenue remains zero
test("complimentary Matters contribute $0 verified revenue", () => {
  const compPaidLike: CanonicalMatterRecord = { ...comp, payment_confirmed: true, amount_paid: 9999 };
  const s = buildMatterPerformanceSnapshot([compPaidLike]);
  assert.equal(s.verifiedRevenue, 0);
  assert.equal(s.complimentaryMatterVolume, 1);
  assert.equal(s.verifiedMatterVolume, 0);
});

// 4. samples are excluded
test("sample records are excluded from all snapshots", () => {
  const s = buildMatterPerformanceSnapshot([paid, sample]);
  assert.equal(s.sampleExcluded, 1);
  assert.equal(s.verifiedRevenue, 1000); // sample's 5000 not counted
  assert.equal(s.sourceRecordCount, 1);
});

// 5. missing evidence returns insufficient evidence
test("zero evidence returns insufficient_evidence", () => {
  assert.equal(buildMatterPerformanceSnapshot([]).evidenceStatus, "insufficient_evidence");
  assert.equal(buildFounderExecutiveSnapshot({}).evidenceStatus, "insufficient_evidence");
});

// 6. integration reliability requires verified events
test("integration reliability requires provider-verified events", () => {
  const unverified = buildIntegrationReliabilitySnapshot([{ integration: "wise", verified: false, success: true }]);
  assert.equal(unverified.evidenceStatus, "insufficient_evidence");
  const verified = buildIntegrationReliabilitySnapshot([{ integration: "wise", verified: true, success: true }]);
  assert.equal(verified.evidenceStatus, "verified");
  assert.equal(verified.integrations[0].verifiedEventCount, 1);
});

// 7. capacity derives only from real active assignments
test("capacity derives from real active assignments only", () => {
  const s = buildCapacitySnapshot([
    { assigneeId: "u1", role: "operator", active: true },
    { assigneeId: "u2", role: "operator", active: false },
    { assigneeId: "u3", role: "va", active: true, isSample: true },
  ]);
  assert.equal(s.byRole.find((r) => r.role === "operator")?.activeAssignments, 1);
  assert.ok(!s.byRole.find((r) => r.role === "va")); // sample excluded
});

// 8. relationship edges require real evidence
test("relationship edges require an organizationId (real evidence)", () => {
  const noOrg: CanonicalMatterRecord = { matterId: "mX", payment_confirmed: true };
  assert.equal(buildRelationshipNetworkSnapshot([noOrg]).evidenceStatus, "insufficient_evidence");
  const withOrg = buildRelationshipNetworkSnapshot([paid]);
  assert.equal(withOrg.edges.length, 1);
  assert.equal(withOrg.edges[0].organizationId, "org1");
});

// 9. unknown values remain null
test("unknown values remain null (forecast, generatedAt)", () => {
  const s = buildMatterPerformanceSnapshot([paid]);
  assert.equal(s.forecastRevenue, null);
  assert.equal(s.generatedAt, null); // not fabricated when not provided
  const stamped = buildMatterPerformanceSnapshot([paid], { generatedAt: "2026-01-01T00:00:00Z" });
  assert.equal(stamped.generatedAt, "2026-01-01T00:00:00Z");
});

// 10. no protected systems imported or mutated
test("no protected systems are imported by the snapshot layer", () => {
  const src = readFileSync("lib/intelligence/enterprise/snapshots.ts", "utf8");
  for (const forbidden of ["lib/payments", "lib/scheduling", "lib/release", "lib/custody", "lib/auth", "supabase", "createAdminClient", "createClient", ".insert(", ".update(", ".delete("]) {
    assert.ok(!src.includes(forbidden), `snapshot layer must not reference ${forbidden}`);
  }
});

// 11 + 12 + 13. routes/Founder Command intact, no duplicate engine
test("Founder Command is extended additively, not replaced", () => {
  const fc = readFileSync("components/founder/FounderCommandCenter.tsx", "utf8");
  assert.ok(/DAILY_COMMAND_ITEMS/.test(fc), "existing daily command items preserved");
  assert.ok(/EnterpriseIntelligenceSection/.test(fc), "section injected");
});

test("no duplicate dashboard/analytics engine — read-only pure functions only", () => {
  const src = readFileSync("lib/intelligence/enterprise/snapshots.ts", "utf8");
  assert.ok(!/class\s+\w+Engine|new Database|createServerClient/.test(src));
  // Organization/vertical roll-ups derive from Matter records, not a new store.
  assert.ok(/excludeSamples/.test(src), "reuses canonical sample governance");
});

test("verticals and organizations only appear with real tags/links", () => {
  const untagged: CanonicalMatterRecord = { matterId: "u", payment_confirmed: true, amount_paid: 100, payment_disposition: "standard_payment" };
  assert.equal(buildVerticalPerformanceSnapshot([untagged]).verticals.length, 0);
  assert.equal(buildOrganizationPerformanceSnapshot([untagged]).activeOrganizations, 0);
});
