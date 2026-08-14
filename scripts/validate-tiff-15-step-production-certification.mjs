import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const RUNBOOK_PATH = "docs/FINAL_PRODUCTION_CERTIFICATION.md";
export const REQUIRED_CONTROLS = [
  "PHASE 2A — TIFF REAL CLIENT-TO-CLOSE ACCEPTANCE", "PASS / FAIL", "Timestamp",
  "Matter ID", "Evidence ID", "Screen / route", "Authoritative backend source",
  "eligible_subtotal", "TIFFTEST50 redeemed exactly once",
  "Before verified payment: scheduling is blocked", "Matter Control Portal through the actual client path",
  "notification actually delivered", "PORTAL ↔ SUPABASE PARITY", "scheduled → in_execution",
  "apostille_processing", "in_transit → delivered → completed", "MOBILE UX / DEAD-ACTION SWEEP",
  "Live PASS remains manual production evidence only",
];

export function validateRunbook(source) {
  for (const control of REQUIRED_CONTROLS) assert.ok(source.includes(control), `Missing certification control: ${control}`);
  let cursor = -1;
  for (let step = 1; step <= 15; step += 1) {
    const marker = `### STEP ${step} —`;
    const next = source.indexOf(marker, cursor + 1);
    assert.ok(next > cursor, `Missing or out-of-order acceptance ${marker}`);
    cursor = next;
  }
  assert.doesNotMatch(source, /TIFFTEST50.{0,80}(unlimited|no[- ]usage[- ]cap|reusable production discount)/i);
  assert.match(source, /NICKTEST50[\s\S]{0,160}DO NOT CREATE/);
  return true;
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  validateRunbook(readFileSync(RUNBOOK_PATH, "utf8"));
  console.log("PASS TIFF real 15-step production certification runbook contract");
  console.log("NOTE Live results are not executed or certified by this validator.");
}
