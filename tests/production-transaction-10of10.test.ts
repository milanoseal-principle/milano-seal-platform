import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("10/10 validator is enforced by the existing merge gate", () => {
  const gate = read("scripts/run-vercel-merge-gate.mjs");
  assert.match(gate, /validate-production-transaction-10of10\.mjs/);
});

test("certification cannot infer live production completion from source checks", () => {
  const validator = read("scripts/validate-production-transaction-10of10.mjs");
  const certification = read("docs/FINAL_PRODUCTION_CERTIFICATION.md");
  assert.match(validator, /LIVE PRODUCTION TRANSACTION CERTIFICATION remains a separate required gate/);
  assert.match(certification, /NOT YET 10\/10/);
  assert.match(certification, /LIVE TRANSACTION TEST:\s*FAIL/);
  assert.match(certification, /PRODUCTION:\s*BLOCKED/);
});

test("source gate locks scheduling, RON, provider evidence, and release boundaries", () => {
  const validator = read("scripts/validate-production-transaction-10of10.mjs");
  for (const invariant of [
    "wise_submission_observed",
    "schedulingAuthorized",
    "NOTARIAL_ACT_REVIEW_REQUIRED",
    "BLUENOTARY_WEBHOOK_SECRET",
    "browser return does not establish completion",
    "custody",
  ]) assert.match(validator, new RegExp(invariant, "i"));
});
