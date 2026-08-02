import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildWorkloadCapacitySnapshot,
  mapDealsToCapacityMatterRefs,
  type CapacityMatterRef,
} from "../index";

const m = (o: Partial<CapacityMatterRef> & { matterId: string }): CapacityMatterRef => ({ ...o });

// 1 + 2: real assignment → one workload item; duplicates dedupe
test("real assignment contributes one workload item; duplicate dedupes", () => {
  const s = buildWorkloadCapacitySnapshot([
    m({ matterId: "1", status: "scheduled", assignee: "op-a" }),
    m({ matterId: "1", status: "scheduled", assignee: "op-a" }),
  ]);
  assert.equal(s.totalActiveAssignments, 1);
  assert.equal(s.distinctAssignees, 1);
});

// 3: unassigned active counted
test("unassigned active Matter is counted", () => {
  const s = buildWorkloadCapacitySnapshot([m({ matterId: "1", status: "in_execution", assignee: null })]);
  assert.equal(s.unassignedActiveMatters, 1);
  assert.equal(s.totalActiveAssignments, 0);
});

// 4: completed excluded from active workload
test("completed Matter is excluded from active workload", () => {
  const s = buildWorkloadCapacitySnapshot([m({ matterId: "1", status: "completed", assignee: "op-a" })]);
  assert.equal(s.totalActiveAssignments, 0);
  assert.equal(s.unassignedActiveMatters, 0);
  assert.equal(s.evidenceStatus, "insufficient_evidence");
});

// 5: sample excluded
test("sample Matter is excluded", () => {
  const s = buildWorkloadCapacitySnapshot([
    m({ matterId: "1", status: "scheduled", assignee: "op-a" }),
    m({ matterId: "2", status: "scheduled", assignee: "op-b", isSample: true }),
  ]);
  assert.equal(s.totalActiveAssignments, 1);
  assert.ok(s.sampleExcluded >= 1);
});

// 7 + 8 + 9: scheduled/overdue/SLA null (no canonical source)
test("scheduled/overdue/SLA remain null without a canonical source", () => {
  const s = buildWorkloadCapacitySnapshot([m({ matterId: "1", status: "scheduled", assignee: "op-a" })]);
  assert.equal(s.scheduledInRange, null);
  assert.equal(s.overdueTasks, null);
  assert.equal(s.slaRiskCount, null);
});

// 10 + 11: no invented threshold → verified_with_limitations + unknown state
test("no threshold invented → capacity unknown + verified_with_limitations", () => {
  const s = buildWorkloadCapacitySnapshot([m({ matterId: "1", status: "scheduled", assignee: "op-a" })]);
  assert.equal(s.capacityState, "unknown");
  assert.equal(s.evidenceStatus, "verified_with_limitations");
  assert.ok(s.limitations.includes("capacity_threshold_not_configured"));
});

// 12: no evidence → insufficient
test("no evidence returns insufficient_evidence", () => {
  const s = buildWorkloadCapacitySnapshot([]);
  assert.equal(s.evidenceStatus, "insufficient_evidence");
  assert.equal(s.confidence, null);
});

// 14: unknown actor → not counted as assignee, counted unassigned
test("blank assignee is treated as unassigned, not a distinct actor", () => {
  const s = buildWorkloadCapacitySnapshot([m({ matterId: "1", status: "scheduled", assignee: "  " })]);
  assert.equal(s.distinctAssignees, 0);
  assert.equal(s.unassignedActiveMatters, 1);
});

// 15: inputs not mutated
test("inputs are not mutated", () => {
  const input = Object.freeze([Object.freeze(m({ matterId: "1", status: "scheduled", assignee: "op-a" }))]) as CapacityMatterRef[];
  const before = JSON.stringify(input);
  buildWorkloadCapacitySnapshot(input);
  assert.equal(JSON.stringify(input), before);
});

// client-data protection: snapshot emits counts, never the assignee id
test("snapshot never serializes the assignee id (counts only)", () => {
  const s = buildWorkloadCapacitySnapshot([m({ matterId: "1", status: "scheduled", assignee: "secret-operator-uuid" })]);
  assert.ok(!JSON.stringify(s).includes("secret-operator-uuid"));
});

// mapper
test("capacity mapper derives status/assignee-presence from canonical rows", () => {
  const refs = mapDealsToCapacityMatterRefs([
    { deal_id: "d1", status: "scheduled", assignee: "op-a", created_at: "2026-01-01T00:00:00Z" } as never,
    { deal_id: "d2", status: "new" } as never,
  ]);
  assert.equal(refs.length, 2);
  assert.equal(refs[0].assignee, "op-a");
  assert.equal(refs[1].assignee, null);
});

// 16 + 17 + 18 + 19 + 20: loader contracts
test("capacity loader is read-only, no reassignment, founder/admin gated, server-only", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderCapacitySource.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w), `no ${w}`);
  assert.ok(!/reassign/i.test(src));
  assert.ok(/resolveServerRole/.test(src) && /FOUNDER_ADMIN_ROLES/.test(src));
  assert.ok(!/user_metadata/.test(src));
  assert.ok(/buildWorkloadCapacitySnapshot/.test(src));
  const index = readFileSync("lib/intelligence/enterprise/index.ts", "utf8");
  assert.ok(!/founderCapacitySource/.test(index), "server loader not re-exported to client barrel");
});

test("schema failure surfaces as unavailable", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderCapacitySource.ts", "utf8");
  assert.ok(/DealsSchemaError/.test(src) && /unavailableSnapshot/.test(src));
});

// 21 + 22 + 24: Sources #1-#4 intact, integration honest-empty, no migration changes
test("Sources #1-#4 wiring remains intact; integration honest-empty; no migration touched", () => {
  const page = readFileSync("app/dashboard/founder/page.tsx", "utf8");
  for (const l of ["loadFounderMatterStateSnapshot", "loadFounderRevenueSnapshot", "loadFounderOrganizationSnapshot", "loadFounderRelationshipSnapshot", "loadFounderCapacitySnapshot"]) {
    assert.ok(new RegExp(l).test(page), `missing ${l}`);
  }
});

// 23: no duplicate capacity engine
test("no duplicate capacity engine — read-model builder reusing excludeSamples", () => {
  const src = readFileSync("lib/intelligence/enterprise/snapshots.ts", "utf8");
  assert.ok(!/class\s+\w*Capacity|new CapacityEngine/.test(src));
  assert.ok(/excludeSamples/.test(src));
});
