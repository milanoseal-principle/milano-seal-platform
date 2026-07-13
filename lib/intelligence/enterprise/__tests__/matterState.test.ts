import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMatterStateSnapshot, mapDealsToMatterStateRecords, type MatterStateRecord } from "../index";

const DAY = 86_400_000;
const rec = (o: Partial<MatterStateRecord> & { matterId: string }): MatterStateRecord => ({ ...o });

// 1. canonical records populate the snapshot
test("canonical Matter records populate the snapshot", () => {
  const s = buildMatterStateSnapshot([
    rec({ matterId: "1", status: "completed", createdAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-03T00:00:00Z", destination: "Italy", documentFamily: "POA" }),
    rec({ matterId: "2", status: "in_execution", destination: "Spain", documentFamily: "Birth" }),
  ]);
  assert.equal(s.evidenceStatus, "verified");
  assert.equal(s.totalMatters, 2);
  assert.equal(s.completedMatters, 1);
  assert.equal(s.activeMatters, 1);
  assert.equal(s.destinationsRepresented, 2);
  assert.equal(s.documentFamiliesRepresented, 2);
});

// 2. sample Matters excluded
test("sample Matters are excluded", () => {
  const s = buildMatterStateSnapshot([
    rec({ matterId: "1", status: "completed" }),
    rec({ matterId: "2", status: "new", isSample: true }),
  ]);
  assert.equal(s.totalMatters, 1);
  assert.equal(s.sampleExcluded, 1);
});

// 3. missing timestamps → null duration
test("missing timestamps produce null average duration", () => {
  const s = buildMatterStateSnapshot([rec({ matterId: "1", status: "completed" })]);
  assert.equal(s.averageCompletionMs, null);
  assert.ok(s.limitations.some((l) => /duration/i.test(l)));
});

test("average duration computes when both timestamps exist", () => {
  const s = buildMatterStateSnapshot([
    rec({ matterId: "1", status: "completed", createdAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-05T00:00:00Z" }),
  ]);
  assert.equal(s.averageCompletionMs, 4 * DAY);
});

// 4. no records → insufficient evidence
test("no records returns insufficient_evidence", () => {
  const s = buildMatterStateSnapshot([]);
  assert.equal(s.evidenceStatus, "insufficient_evidence");
  assert.equal(s.confidence, null);
});

// 5 + 6. completed/active use canonical state only
test("completed and active counts use canonical stage state only", () => {
  const s = buildMatterStateSnapshot([
    rec({ matterId: "1", status: "completed" }),
    rec({ matterId: "2", status: "lost" }), // terminal, not active, not completed
    rec({ matterId: "3", status: "scheduled" }),
    rec({ matterId: "4", status: null }), // unknown state → not active/completed
  ]);
  assert.equal(s.completedMatters, 1);
  assert.equal(s.activeMatters, 1); // only "scheduled"
  assert.equal(s.blockedMatters, null); // no canonical blocked stage
});

// 7. no revenue inferred
test("Matter-state snapshot infers no revenue", () => {
  const s = buildMatterStateSnapshot([rec({ matterId: "1", status: "completed" })]);
  assert.ok(!("verifiedRevenue" in s));
  assert.ok(!("revenue" in s));
});

// 8. no organization metric inferred
test("Matter-state snapshot infers no organization metric", () => {
  const s = buildMatterStateSnapshot([rec({ matterId: "1", status: "completed" })]);
  assert.ok(!("activeOrganizations" in s));
});

// 9. inputs not mutated
test("input records are not mutated", () => {
  const input = Object.freeze([Object.freeze(rec({ matterId: "1", status: "completed", createdAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-02T00:00:00Z" }))]) as MatterStateRecord[];
  const before = JSON.stringify(input);
  buildMatterStateSnapshot(input);
  assert.equal(JSON.stringify(input), before);
});

// mapper: deals rows → records, unknowns null
test("mapper maps canonical deal columns and keeps unknowns null", () => {
  const recs = mapDealsToMatterStateRecords([
    { deal_id: "d1", status: "completed", created_at: "2026-01-01T00:00:00Z", completed_at: "2026-01-02T00:00:00Z", country: "Italy", document_type: "POA" },
    { id: "d2", status: "new" },
  ]);
  assert.equal(recs[0].matterId, "d1");
  assert.equal(recs[0].destination, "Italy");
  assert.equal(recs[1].destination, null);
  assert.equal(recs[1].completedAt, null);
});

// 10 + 11 + 12 + 13. server adapter contracts (source-level)
test("server loader is read-only, founder/admin gated, and not client-exported", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderMatterSource.ts", "utf8");
  // read-only: no writes
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) {
    assert.ok(!src.includes(w), `loader must not ${w}`);
  }
  // founder/admin authorization via canonical app_metadata resolver
  assert.ok(/resolveServerRole/.test(src));
  assert.ok(/FOUNDER_ADMIN_ROLES/.test(src));
  assert.ok(!/user_metadata/.test(src), "no user_metadata authorization");
  // server-only: not re-exported from the client-imported barrel
  const index = readFileSync("lib/intelligence/enterprise/index.ts", "utf8");
  assert.ok(!/\.\/server\//.test(index), "server loader must not be re-exported from index");
});

test("no client component imports the server loader", () => {
  // grep-style: the section (client) imports only the pure barrel, never /server.
  const section = readFileSync("components/founder/EnterpriseIntelligenceSection.tsx", "utf8");
  assert.ok(!/enterprise\/server/.test(section));
});

// 13. raw Matter rows are not passed to the client component
test("only a computed snapshot (not raw rows) is passed to the client section", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderMatterSource.ts", "utf8");
  assert.ok(/buildMatterStateSnapshot/.test(src), "loader returns a computed snapshot");
  const page = readFileSync("app/dashboard/founder/page.tsx", "utf8");
  assert.ok(/loadFounderMatterStateSnapshot/.test(page));
  assert.ok(/matterState=\{matterState\}/.test(page));
});

// 14. existing Founder Command intact
test("existing Founder Command remains intact", () => {
  const fc = readFileSync("components/founder/FounderCommandCenter.tsx", "utf8");
  assert.ok(/DAILY_COMMAND_ITEMS/.test(fc));
  assert.ok(/EnterpriseIntelligenceSection/.test(fc));
});

// 15. remaining snapshots retain honest empty states
test("remaining snapshots retain honest empty states (revenue/org deferred)", () => {
  const section = readFileSync("components/founder/EnterpriseIntelligenceSection.tsx", "utf8");
  // Executive tiles still derive from the (empty) FounderExecutiveSnapshot.
  assert.ok(/buildFounderExecutiveSnapshot/.test(section));
  assert.ok(/Insufficient evidence/.test(section));
});
