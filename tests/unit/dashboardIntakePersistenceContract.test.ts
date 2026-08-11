import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const intakeRoute = fs.readFileSync(path.join(root, "app/api/intake/route.ts"), "utf8");
const intakeCore = fs.readFileSync(path.join(root, "app/api/intake/core.ts"), "utf8");
const intake = `${intakeRoute}\n${intakeCore}`;
const dashboardIntake = fs.readFileSync(path.join(root, "app/dashboard/intake/page.tsx"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/049_dashboard_intake_payment_status_reconciliation.sql"),
  "utf8",
);

test("production schema accepts canonical unpaid intake state and persists discount amount", () => {
  assert.match(migration, /add column if not exists discount_amount/i);
  assert.match(migration, /alter column payment_status set default 'unpaid'/i);
  assert.match(migration, /drop constraint if exists deals_payment_status_check/i);
  assert.match(migration, /'unpaid'/i);
  assert.match(migration, /'pending'/i);
  assert.match(migration, /'paid'/i);
  assert.doesNotMatch(migration, /update\s+public\.deals[\s\S]*payment_status\s*=\s*'unpaid'/i);
});

test("intake persistence fails closed instead of silently saving a stripped fallback Matter", () => {
  assert.match(intake, /code: "PERSISTENCE_FAILED"/);
  assert.match(intake, /correlation_id: correlationId/);
  assert.match(intake, /\.insert\(\[intakePayload\]\)/);
  assert.doesNotMatch(intake, /minimalPayload/);
  assert.doesNotMatch(intake, /barePayload/);
  assert.doesNotMatch(intake, /attempt1_msg|attempt2_msg|attempt3_msg|supabase_code/);
});

test("operator intake surfaces safe error code and correlation reference", () => {
  assert.match(dashboardIntake, /Unable to create Matter/);
  assert.match(dashboardIntake, /Error code:/);
  assert.match(dashboardIntake, /Reference:/);
  assert.match(dashboardIntake, /data\.correlation_id/);
  assert.doesNotMatch(dashboardIntake, /service role key|SUPABASE_SERVICE_ROLE_KEY/i);
});

test("critical intake workflow no longer silently swallows compliance failure", () => {
  assert.doesNotMatch(intake, /validateCompliance\([\s\S]*?\}\s*catch\s*\{\s*\}/);
  assert.match(intake, /COMPLIANCE_REVIEW_REQUIRED/);
});