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
  "verified Wise settlement",
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
  assert.match(source, /Only verified Wise settlement[\s\S]{0,200}payment gate/i);
  return true;
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  validateRunbook(readFileSync(RUNBOOK_PATH, "utf8"));
  console.log("PASS Tiffany Gate 37 99% portal-discount certification runbook contract");
  console.log("NOTE Live results are not executed or certified by this validator.");
}
