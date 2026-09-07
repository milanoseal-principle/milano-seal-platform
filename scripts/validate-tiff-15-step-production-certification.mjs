import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const RUNBOOK_PATH = "docs/control-plane/09_TIFFANY_FINAL_15_STEP_PRODUCTION_TEST.md";
export const REQUIRED_CONTROLS = [
  "Gate 37",
  "MS-2026-4887",
  "TIFFTEST99",
  "99% percentage discount applied to `matter_total`",
  "$1,375.00",
  "$1,361.25",
  "$13.75",
  "$6.88",
  "$6.87",
  "itemized order ledger",
  "Discount / Courtesy Code",
  "scheduling remains blocked",
  "payment_observed_at",
  "valid observed Wise submission unlocks scheduling",
  "settlement remains pending",
  "BlueNotary session starts",
  "in_execution",
  "signed documents retrieved",
  "explicit Apostille QA approval",
  "apostille_processing",
  "Forgot Password",
  "no duplicate Matter",
  "PASS / FAIL",
];

export function validateRunbook(source) {
  for (const control of REQUIRED_CONTROLS) {
    assert.ok(source.includes(control), `Missing certification control: ${control}`);
  }

  let cursor = -1;
  for (let step = 1; step <= 15; step += 1) {
    const marker = `${step}.`;
    const next = source.indexOf(marker, cursor + 1);
    assert.ok(next > cursor, `Missing or out-of-order acceptance step ${step}`);
    cursor = next;
  }

  assert.doesNotMatch(source, /TIFFTEST50/);
  assert.match(source, /TIFFTEST99[\s\S]{0,220}99%/);
  assert.match(source, /discount[\s\S]{0,300}never marks a Matter paid/i);
  assert.match(source, /observed Wise submission[\s\S]{0,260}unlock scheduling/i);
  assert.match(source, /does not mark the Matter paid/i);
  assert.match(source, /final release remains separately settlement-gated/i);
  assert.match(source, /Scheduled[\s\S]{0,400}BlueNotary session starts[\s\S]{0,240}in_execution/);
  assert.match(source, /signed documents retrieved[\s\S]{0,240}explicit Apostille QA approval[\s\S]{0,240}apostille_processing/i);
  assert.match(source, /client must never guess acknowledgment vs jurat/i);
  return true;
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  validateRunbook(readFileSync(RUNBOOK_PATH, "utf8"));
  console.log("PASS Tiffany Gate 37 post-payment RON production certification runbook contract");
  console.log("NOTE Live BlueNotary identity/session execution is not performed or certified by this validator.");
}
