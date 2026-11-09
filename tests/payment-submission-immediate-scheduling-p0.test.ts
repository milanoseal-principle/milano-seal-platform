// RETIRED CONTRACT (2026-11-09): a Wise submission no longer authorizes scheduling.
// This file keeps its historical path and now pins the inverse of the old rule.
// The full matrix lives in tests/verified-settlement-before-scheduling-p0.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const schedulingGate = fs.readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const legacyEntry = fs.readFileSync("scripts/validate-immediate-scheduling-after-wise-submission.mjs", "utf8");

test("retired immediate-scheduling contract is absent from the canonical gate", () => {
  assert.doesNotMatch(schedulingGate, /wise_submission_observed/);
  assert.doesNotMatch(schedulingGate, /authorizes scheduling only/);
  assert.match(schedulingGate, /hasExactVerifiedSettlement/);
});

test("historical validator entry point delegates to the settlement-before-scheduling validator", () => {
  assert.match(legacyEntry, /validate-verified-settlement-before-scheduling\.mjs/);
  assert.match(legacyEntry, /RETIRED CONTRACT/);
});
