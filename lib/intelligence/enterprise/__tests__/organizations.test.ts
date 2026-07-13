import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildOrganizationInventorySnapshot,
  mapDealsToOrganizationRecords,
  type OrganizationRecord,
} from "../index";

const org = (o: Partial<OrganizationRecord> & { organizationKey: string }): OrganizationRecord => ({ ...o });

// 1. real records populate the snapshot
test("real Organization records populate the snapshot", () => {
  const s = buildOrganizationInventorySnapshot([
    org({ organizationKey: "Acme Law", geography: "Italy", firstSeenAt: "2026-01-01T00:00:00Z" }),
    org({ organizationKey: "Beta Firm", geography: "Spain", firstSeenAt: "2026-01-02T00:00:00Z" }),
    org({ organizationKey: "Acme Law", geography: "Italy" }), // same org, deduped
  ]);
  assert.equal(s.evidenceStatus, "verified");
  assert.equal(s.totalOrganizations, 2);
  assert.equal(s.byGeography.find((g) => g.geography === "Italy")?.organizations, 1);
});

// 2. sample orgs excluded
test("sample Organizations are excluded", () => {
  const s = buildOrganizationInventorySnapshot([
    org({ organizationKey: "Real Co" }),
    org({ organizationKey: "Demo Co", isSample: true }),
  ]);
  assert.equal(s.totalOrganizations, 1);
  assert.equal(s.sampleExcluded, 1);
});

// 3. unknown fields remain null
test("unsupported org fields remain null with limitations", () => {
  const s = buildOrganizationInventorySnapshot([org({ organizationKey: "Real Co" })]);
  assert.equal(s.activeOrganizations, null);
  assert.equal(s.targetOrganizations, null);
  assert.equal(s.byVertical, null);
  assert.ok(s.limitations.some((l) => /active\/target/i.test(l)));
  assert.ok(s.limitations.some((l) => /vertical/i.test(l)));
});

// 4. no orgs → insufficient evidence
test("no organizations returns insufficient_evidence", () => {
  const s = buildOrganizationInventorySnapshot([]);
  assert.equal(s.evidenceStatus, "insufficient_evidence");
  assert.equal(s.confidence, null);
  assert.equal(s.totalOrganizations, 0);
});

// 5. target stage counted only from canonical values (none → null)
test("target organizations only from canonical values (null when unsupported)", () => {
  const s = buildOrganizationInventorySnapshot([org({ organizationKey: "Real Co" })]);
  assert.equal(s.targetOrganizations, null);
});

// 6. active status only when canonically supported (null)
test("active organizations null when no canonical status field", () => {
  const s = buildOrganizationInventorySnapshot([org({ organizationKey: "Real Co" })]);
  assert.equal(s.activeOrganizations, null);
});

// 7. commercial-account count uses canonical evidence only
test("commercial-account count uses supplied canonical evidence only", () => {
  const zero = buildOrganizationInventorySnapshot([org({ organizationKey: "Real Co" })]);
  assert.equal(zero.commercialAccounts, 0);
  const three = buildOrganizationInventorySnapshot([org({ organizationKey: "Real Co" })], { commercialAccounts: 3 });
  assert.equal(three.commercialAccounts, 3);
});

// 8. vertical totals use real records only
test("vertical totals only when real vertical evidence exists", () => {
  const none = buildOrganizationInventorySnapshot([org({ organizationKey: "A" })]);
  assert.equal(none.byVertical, null);
  const withV = buildOrganizationInventorySnapshot([org({ organizationKey: "A", vertical: "maritime" })]);
  assert.deepEqual(withV.byVertical, [{ vertical: "maritime", organizations: 1 }]);
});

// 9. geography totals use real records only
test("geography totals use real records only", () => {
  const s = buildOrganizationInventorySnapshot([
    org({ organizationKey: "A", geography: "Italy" }),
    org({ organizationKey: "B", geography: null }),
  ]);
  assert.equal(s.byGeography.length, 1);
});

// 10 + 11 + 12. no relationship/revenue/health inferred
test("no relationship, revenue, or account-health fields are inferred", () => {
  const s = buildOrganizationInventorySnapshot([org({ organizationKey: "A" })]) as unknown as Record<string, unknown>;
  for (const k of ["relationshipStrength", "verifiedRevenue", "accountHealth", "dormancyRisk", "enterpriseScore", "networkStrength", "repeatRate"]) {
    assert.ok(!(k in s), `must not infer ${k}`);
  }
});

// 13. inputs not mutated
test("input records are not mutated", () => {
  const input = Object.freeze([Object.freeze(org({ organizationKey: "A", geography: "Italy" }))]) as OrganizationRecord[];
  const before = JSON.stringify(input);
  buildOrganizationInventorySnapshot(input);
  assert.equal(JSON.stringify(input), before);
});

// new-in-range
test("newInRange counts orgs first seen at/after the range start", () => {
  const s = buildOrganizationInventorySnapshot(
    [
      org({ organizationKey: "Old", firstSeenAt: "2025-01-01T00:00:00Z" }),
      org({ organizationKey: "New", firstSeenAt: "2026-02-01T00:00:00Z" }),
    ],
    { rangeFromIso: "2026-01-01T00:00:00Z" },
  );
  assert.equal(s.newInRange, 1);
});

// mapper: deals → org records
test("org mapper uses company_name + destination_country and drops blank orgs", () => {
  const recs = mapDealsToOrganizationRecords([
    { company_name: "Acme Law", destination_country: "Italy", created_at: "2026-01-01T00:00:00Z" },
    { company_name: "  ", destination_country: "Spain" }, // blank org name dropped
    { destination_country: "France" }, // no company_name dropped
  ]);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].organizationKey, "Acme Law");
  assert.equal(recs[0].geography, "Italy");
  assert.equal(recs[0].vertical, null);
});

// 14 + 15 + 16 + 17. server adapter contracts
test("org loader is read-only, founder/admin gated, server-only, computed-snapshot only", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderOrganizationSource.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w), `no ${w}`);
  const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.ok(!/\bfetch\(|https?:\/\//i.test(code), "no outbound requests");
  assert.ok(!/select\("\*"\)/.test(code), "explicit safe column list only");
  assert.ok(/resolveServerRole/.test(src) && /FOUNDER_ADMIN_ROLES/.test(src), "founder/admin gated");
  assert.ok(!/user_metadata/.test(src), "no user_metadata authz");
  assert.ok(/buildOrganizationInventorySnapshot/.test(src), "returns computed snapshot");
  const index = readFileSync("lib/intelligence/enterprise/index.ts", "utf8");
  assert.ok(!/founderOrganizationSource/.test(index), "server loader not re-exported to client barrel");
});

test("no PII/notes/billing columns are selected (via canonical adapter)", () => {
  // The org loader delegates to the canonical adapter; the safe column list lives there.
  const loader = readFileSync("lib/intelligence/enterprise/server/founderOrganizationSource.ts", "utf8");
  assert.ok(/fetchCanonicalDeals/.test(loader), "uses the canonical adapter");
  const adapter = readFileSync("lib/deals/canonicalDealReadModel.ts", "utf8");
  const selectArg = adapter.match(/CANONICAL_DEAL_COLUMNS\s*=\s*\n?\s*"([^"]*)"/)?.[1] ?? "";
  assert.ok(/company_name/.test(selectArg), "adapter selects the org proxy");
  assert.ok(!/email|phone|note|billing|client_name|payload|credential/i.test(selectArg), `unsafe column: ${selectArg}`);
});

// 18. Matter + Revenue snapshots intact
test("Matter and Revenue wiring remain intact", () => {
  const page = readFileSync("app/dashboard/founder/page.tsx", "utf8");
  assert.ok(/loadFounderMatterStateSnapshot/.test(page));
  assert.ok(/loadFounderRevenueSnapshot/.test(page));
  assert.ok(/loadFounderOrganizationSnapshot/.test(page));
});

// 19. deferred snapshots remain honest-empty
test("deferred snapshots (relationship/capacity/integration) remain honest-empty", () => {
  const section = readFileSync("components/founder/EnterpriseIntelligenceSection.tsx", "utf8");
  assert.ok(/Relationship Edges/.test(section));
  assert.ok(/buildFounderExecutiveSnapshot/.test(section), "still derives empty exec snapshot for deferred fields");
});

// 20. no duplicate org engine
test("no duplicate Organization engine — read-only builder reusing excludeSamples", () => {
  const src = readFileSync("lib/intelligence/enterprise/snapshots.ts", "utf8");
  assert.ok(!/class\s+\w*Organization|new OrganizationEngine/.test(src));
  assert.ok(/excludeSamples/.test(src));
});
