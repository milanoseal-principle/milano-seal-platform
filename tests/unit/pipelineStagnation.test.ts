import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateMatterStagnation,
  evaluatePipelineStagnation,
  STAGNATION_POLICY,
  type StagnationSourceRow,
} from "@/lib/matter/pipelineStagnation";

const NOW = Date.parse("2026-09-07T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const hoursAhead = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

test("apostille past the 72h alert threshold raises an ALERT with proven stage age", () => {
  const row: StagnationSourceRow = {
    id: "m1",
    deal_id: "MS-1",
    status: "apostille",
    apostille_at: hoursAgo(80),
    updated_at: hoursAgo(1),
  };
  const e = evaluateMatterStagnation(row, NOW);
  assert.equal(e.canonicalStatus, "apostille_processing");
  assert.equal(e.severity, "ALERT");
  assert.equal(e.basis, "stage_entry");
  assert.equal(e.basisField, "apostille_at");
  assert.equal(Math.round(e.ageHours ?? 0), 80);
  assert.equal(e.overdueByHours, 8);
  assert.ok(e.nextAction.length > 0);
});

test("apostille well past critical raises CRITICAL", () => {
  const row: StagnationSourceRow = { id: "m2", status: "apostille", apostille_at: hoursAgo(130) };
  assert.equal(evaluateMatterStagnation(row, NOW).severity, "CRITICAL");
});

test("courier/shipped uses shipped_at as stage-entry basis", () => {
  const row: StagnationSourceRow = { id: "m3", status: "shipped", shipped_at: hoursAgo(30) };
  const e = evaluateMatterStagnation(row, NOW);
  assert.equal(e.canonicalStatus, "shipped");
  assert.equal(e.basisField, "shipped_at");
  assert.equal(e.severity, "WATCH"); // 30h ≥ watch(24) but < alert(48)
});

test("awaiting payment measures inactivity from updated_at (last_activity basis)", () => {
  const row: StagnationSourceRow = {
    id: "m4",
    status: "awaiting_payment",
    created_at: hoursAgo(400),
    updated_at: hoursAgo(26),
  };
  const e = evaluateMatterStagnation(row, NOW);
  assert.equal(e.basis, "last_activity");
  assert.equal(e.basisField, "updated_at");
  assert.equal(e.severity, "ALERT"); // 26h ≥ alert(24)
});

test("FAIL CLOSED: monitored stage with no basis timestamp is INSUFFICIENT_EVIDENCE, no fabricated age", () => {
  const row: StagnationSourceRow = { id: "m5", status: "apostille" }; // no apostille_at/updated_at
  const e = evaluateMatterStagnation(row, NOW);
  assert.equal(e.severity, "INSUFFICIENT_EVIDENCE");
  assert.equal(e.ageHours, null);
  assert.equal(e.stageSince, null);
});

test("FAIL CLOSED: a future basis timestamp is not trusted as elapsed time", () => {
  const row: StagnationSourceRow = { id: "m6", status: "shipped", shipped_at: hoursAhead(5) };
  const e = evaluateMatterStagnation(row, NOW);
  assert.equal(e.severity, "INSUFFICIENT_EVIDENCE");
  assert.equal(e.ageHours, null);
});

test("terminal and dormant matters are never stagnant", () => {
  for (const status of ["completed", "lost", "dormant"]) {
    const e = evaluateMatterStagnation({ id: `t-${status}`, status, updated_at: hoursAgo(1000) }, NOW);
    assert.equal(e.monitored, false);
    assert.equal(e.severity, "OK");
  }
});

test("unmonitored stage produces no alert", () => {
  const e = evaluateMatterStagnation({ id: "q1", status: "quoted", updated_at: hoursAgo(1000) }, NOW);
  assert.equal(e.monitored, false);
  assert.equal(e.severity, "OK");
});

test("fresh matter within threshold is OK", () => {
  const e = evaluateMatterStagnation({ id: "f1", status: "apostille", apostille_at: hoursAgo(10) }, NOW);
  assert.equal(e.severity, "OK");
  assert.equal(e.overdueByHours, null);
});

test("summary sorts most-severe first then by greatest age, and buckets insufficient evidence", () => {
  const rows: StagnationSourceRow[] = [
    { id: "a", status: "apostille", apostille_at: hoursAgo(80) }, // ALERT 80h
    { id: "b", status: "apostille", apostille_at: hoursAgo(130) }, // CRITICAL
    { id: "c", status: "shipped", shipped_at: hoursAgo(30) }, // WATCH
    { id: "d", status: "apostille" }, // INSUFFICIENT
    { id: "e", status: "completed", updated_at: hoursAgo(999) }, // OK
    { id: "f", status: "apostille", apostille_at: hoursAgo(76) }, // ALERT 76h
  ];
  const summary = evaluatePipelineStagnation(rows, NOW);
  assert.deepEqual(
    summary.alerts.map((a) => a.matterId),
    ["b", "a", "f", "c"],
  );
  assert.equal(summary.insufficientEvidence.length, 1);
  assert.equal(summary.counts.CRITICAL, 1);
  assert.equal(summary.counts.ALERT, 2);
  assert.equal(summary.counts.WATCH, 1);
  assert.equal(summary.counts.INSUFFICIENT_EVIDENCE, 1);
  assert.equal(summary.evaluatedCount, 6);
});

test("policy only monitors defensible stages and every policy has a timestamp basis", () => {
  const monitored = Object.keys(STAGNATION_POLICY);
  assert.ok(monitored.includes("apostille_processing"));
  assert.ok(monitored.includes("shipped"));
  assert.ok(!monitored.includes("completed"));
  for (const policy of Object.values(STAGNATION_POLICY)) {
    assert.ok(policy && policy.timestampFields.length > 0);
    assert.ok(policy.watchHours <= policy.alertHours);
    assert.ok(policy.alertHours <= policy.criticalHours);
  }
});
