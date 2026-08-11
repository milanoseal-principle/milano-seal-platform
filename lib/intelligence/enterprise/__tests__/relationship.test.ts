import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildRelationshipNetworkSnapshot,
  mapDealsToRelationshipMatterRefs,
  mapDealActivitiesToInteractions,
  type RelationshipMatterRef,
  type RelationshipInteraction,
} from "../index";

const m = (o: Partial<RelationshipMatterRef> & { matterId: string }): RelationshipMatterRef => ({ ...o });
const it = (o: Partial<RelationshipInteraction> & { matterId: string }): RelationshipInteraction => ({ ...o });

// 1 + 2: org↔Matter edge, deduped
test("real Matter evidence creates one org↔Matter edge; duplicates dedupe", () => {
  const s = buildRelationshipNetworkSnapshot({
    matters: [m({ matterId: "1", organizationKey: "Acme" }), m({ matterId: "1", organizationKey: "Acme" })],
    interactions: [],
  });
  assert.equal(s.edges.length, 1);
  assert.equal(s.organizationsWithMatterEvidence, 1);
  assert.equal(s.evidenceStatus, "verified");
});

// 3 + 4: interaction edge + dedupe
test("interaction evidence counts; identical rows dedupe", () => {
  const s = buildRelationshipNetworkSnapshot({
    matters: [m({ matterId: "1", organizationKey: "Acme" })],
    interactions: [
      it({ matterId: "1", activityType: "call", occurredAt: "2026-01-02T00:00:00Z" }),
      it({ matterId: "1", activityType: "call", occurredAt: "2026-01-02T00:00:00Z" }),
      it({ matterId: "1", activityType: "email", occurredAt: "2026-01-03T00:00:00Z" }),
    ],
  });
  assert.equal(s.interactionCount, 2);
  assert.equal(s.organizationsWithInteractionEvidence, 1);
  assert.equal(s.latestInteraction, "2026-01-03T00:00:00Z");
});

// 5: referral edges null (no canonical referral source)
test("referral edges remain null without a canonical referral source", () => {
  const s = buildRelationshipNetworkSnapshot({ matters: [m({ matterId: "1", organizationKey: "A" })], interactions: [] });
  assert.equal(s.verifiedReferralEdges, null);
  assert.ok(s.limitations.some((l) => /referral/i.test(l)));
});

// 6 + 7: samples excluded
test("sample Matters and sample interactions are excluded", () => {
  const s = buildRelationshipNetworkSnapshot({
    matters: [m({ matterId: "1", organizationKey: "A" }), m({ matterId: "2", organizationKey: "B", isSample: true })],
    interactions: [it({ matterId: "1", occurredAt: "2026-01-01T00:00:00Z" }), it({ matterId: "1", activityType: "x", occurredAt: "2026-01-01T00:00:00Z", isSample: true })],
  });
  assert.equal(s.edges.length, 1);
  assert.equal(s.interactionCount, 1);
  assert.ok(s.sampleExcluded >= 2);
});

// 8: no evidence → insufficient
test("no evidence returns insufficient_evidence", () => {
  const s = buildRelationshipNetworkSnapshot({ matters: [], interactions: [] });
  assert.equal(s.evidenceStatus, "insufficient_evidence");
  assert.equal(s.edges.length, 0);
  assert.equal(s.interactionCount, 0);
});

// 11 + 12 + 13: unsupported metrics absent/null
test("no relationship score / network strength / dormancy is inferred", () => {
  const s = buildRelationshipNetworkSnapshot({ matters: [m({ matterId: "1", organizationKey: "A" })], interactions: [] }) as unknown as Record<string, unknown>;
  for (const k of ["relationshipScore", "networkStrength", "influence", "strategicValue", "dormancy", "referralValue"]) {
    assert.ok(!(k in s), `must not infer ${k}`);
  }
});

// 14: latest activity from real timestamp
test("latest activity uses a real timestamp", () => {
  const s = buildRelationshipNetworkSnapshot({ matters: [m({ matterId: "1", organizationKey: "A" })], interactions: [it({ matterId: "1", occurredAt: "2026-05-05T00:00:00Z" })] });
  assert.equal(s.latestInteraction, "2026-05-05T00:00:00Z");
});

// 15: no org edge without org identity
test("no org edge is created without an organization key", () => {
  const s = buildRelationshipNetworkSnapshot({ matters: [m({ matterId: "1", organizationKey: null })], interactions: [] });
  assert.equal(s.edges.length, 0);
});

// 17: inputs not mutated
test("inputs are not mutated", () => {
  const matters = Object.freeze([Object.freeze(m({ matterId: "1", organizationKey: "A" }))]) as RelationshipMatterRef[];
  const interactions = Object.freeze([Object.freeze(it({ matterId: "1", occurredAt: "2026-01-01T00:00:00Z" }))]) as RelationshipInteraction[];
  const before = JSON.stringify({ matters, interactions });
  buildRelationshipNetworkSnapshot({ matters, interactions });
  assert.equal(JSON.stringify({ matters, interactions }), before);
});

// mappers
test("mappers derive refs/interactions from canonical rows; PII columns not read", () => {
  const refs = mapDealsToRelationshipMatterRefs([{ deal_id: "d1", company_name: "Acme" }, { deal_id: "d2", company_name: "  " }]);
  assert.equal(refs.length, 2);
  assert.equal(refs[0].organizationKey, "Acme");
  assert.equal(refs[1].organizationKey, null);
  const ints = mapDealActivitiesToInteractions([{ deal_id: "d1", activity_type: "call", created_at: "2026-01-01T00:00:00Z" }, { activity_type: "x" }]);
  assert.equal(ints.length, 1);
  assert.equal(ints[0].activityType, "call");
});

// 9 + 18 + 19 + 20 + 21: server loader contracts
test("relationship loader is read-only, founder/admin gated, server-only, computed-snapshot only", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderRelationshipSource.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w), `no ${w}`);
  assert.ok(/resolveServerRole/.test(src) && /FOUNDER_ADMIN_ROLES/.test(src));
  assert.ok(!/user_metadata/.test(src));
  assert.ok(/buildRelationshipNetworkSnapshot/.test(src));
  // No PII columns selected from deal_activities.
  const sel = src.match(/from\("deal_activities"\)\s*\.select\("([^"]*)"\)/)?.[1] ?? "";
  assert.ok(/deal_id/.test(sel) && /activity_type/.test(sel) && /created_at/.test(sel));
  assert.ok(!/description|old_value|new_value|operator|email|phone|note/i.test(sel), `unsafe column: ${sel}`);
  const index = readFileSync("lib/intelligence/enterprise/index.ts", "utf8");
  assert.ok(!/founderRelationshipSource/.test(index), "server loader not re-exported to client barrel");
});

test("schema failure surfaces as unavailable, not fake zeros", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderRelationshipSource.ts", "utf8");
  assert.ok(/DealsSchemaError/.test(src) && /unavailableSnapshot/.test(src));
});

// 22 + 23 + 24: Sources #1-#3 intact; capacity/integration honest-empty
test("Sources #1-#3 wiring remains intact and capacity/integration stay empty", () => {
  const page = readFileSync("app/dashboard/founder/page.tsx", "utf8");
  for (const l of ["loadFounderMatterStateSnapshot", "loadFounderRevenueSnapshot", "loadFounderOrganizationSnapshot", "loadFounderRelationshipSnapshot"]) {
    assert.ok(new RegExp(l).test(page), `missing ${l}`);
  }
  const section = readFileSync("components/founder/EnterpriseIntelligenceSection.tsx", "utf8");
  // Capacity/Integration are not wired as props → still derived empty from exec snapshot.
  assert.ok(/buildFounderExecutiveSnapshot/.test(section));
});

// 25: no duplicate relationship engine
test("no duplicate Relationship Intelligence engine — reuses read-model builder + excludeSamples", () => {
  const src = readFileSync("lib/intelligence/enterprise/snapshots.ts", "utf8");
  assert.ok(!/class\s+\w*Relationship|new RelationshipEngine/.test(src));
  assert.ok(/excludeSamples/.test(src));
});
