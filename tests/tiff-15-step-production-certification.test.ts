import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-ignore - the validator is intentionally dependency-free JavaScript
import { REQUIRED_CONTROLS, RUNBOOK_PATH, validateRunbook } from "../scripts/validate-tiff-15-step-production-certification.mjs";

const runbook = readFileSync(RUNBOOK_PATH, "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const migrations = readFileSync("supabase/migrations/048_production_discount_schema_reconciliation.sql", "utf8");

test("TIFF certification validator is registered and accepts the controlling runbook", () => {
  assert.equal(packageJson.scripts["validate:tiff-15-step-production-certification"], "node scripts/validate-tiff-15-step-production-certification.mjs");
  assert.equal(validateRunbook(runbook), true);
  assert.ok(REQUIRED_CONTROLS.length >= 18);
});

test("TIFFTEST50 stays single-redemption governed and is never public or reusable", () => {
  assert.match(runbook, /TIFFTEST50 redeemed exactly once/);
  assert.match(runbook, /replay[^\n]*does not create a second redemption/i);
  assert.match(runbook, /not a public reusable client discount/i);
  assert.doesNotMatch(migrations, /TIFFTEST50[\s\S]{0,100}(unlimited|no[-_ ]usage[-_ ]cap)/i);
});

test("certification locks transaction truth and governed closeout regressions", () => {
  for (const rule of ["Before verified payment: scheduling is blocked", "scheduled → in_execution",
    "apostille cannot skip execution", "delivery cannot skip canonical release and transit stages",
    "cross-client Matter access", "portal cannot report paid before canonical backend truth",
    "false-success UI", "notification actually delivered", "real destinations"]) {
    assert.ok(runbook.includes(rule), `missing regression lock: ${rule}`);
  }
});
