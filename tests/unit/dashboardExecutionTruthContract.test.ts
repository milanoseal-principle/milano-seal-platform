import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dashboard = fs.readFileSync(
  path.join(root, "app/dashboard/intake/page.tsx"),
  "utf8",
);
const intakeRoute = fs.readFileSync(
  path.join(root, "app/api/intake/route.ts"),
  "utf8",
);
const intakeCore = fs.readFileSync(
  path.join(root, "app/api/intake/core.ts"),
  "utf8",
);
const intake = `${intakeRoute}\n${intakeCore}`;
const quote = fs.readFileSync(
  path.join(root, "app/api/pricing/quote/route.ts"),
  "utf8",
);
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/050_live_intake_execution_truth_reconciliation.sql"),
  "utf8",
);

test("operator dashboard captures all canonical execution decisions", () => {
  for (const field of [
    "notarization_requirement",
    "execution_method",
    "notarial_act",
    "authentication_requirement",
    "signer_location",
    "execution_location",
    "assigned_notary",
    "notary_jurisdiction",
    "certificate_type",
    "ron_kba_status",
    "ron_credential_analysis_status",
  ]) {
    assert.match(dashboard, new RegExp(field));
  }
  for (const value of [
    "already_notarized",
    "third_party_notary",
    "authentication_legalization",
    "oath_affirmation",
    "signature_witnessing",
    "review_required",
  ]) {
    assert.match(dashboard, new RegExp(value));
  }
});

test("intake permanently removes mobile=false to RON inference", () => {
  assert.doesNotMatch(intake, /data\.mobile\s*\?\s*["']mobile["']\s*:\s*["']ron["']/);
  assert.doesNotMatch(intake, /mobile\s*===?\s*false[\s\S]{0,80}ron/i);
  assert.match(intake, /executionTruth\.execution_method === "ron"/);
  assert.match(intake, /executionTruth\.execution_method === "mobile"/);
});

test("apostille/authentication never auto-creates notarization", () => {
  assert.doesNotMatch(intake, /compliance\.apostille_required\)\s*data\.apostille\s*=\s*true/);
  assert.match(intake, /const apostilleRequired = hasCanonicalExecution/);
  assert.match(intake, /execution_truth: executionTruth/);
});

test("operator review-required execution stops before Wise", () => {
  const reviewPosition = intake.indexOf('"EXECUTION_REVIEW_REQUIRED"');
  const wisePosition = intake.indexOf("createWisePaymentRequest({");
  assert.ok(reviewPosition > -1);
  assert.ok(wisePosition > reviewPosition);
  assert.match(intake, /sourceHint === "admin"/);
});

test("live quote consumes execution truth and exposes review state", () => {
  assert.match(quote, /normalizeExecutionTruth\(body\)/);
  assert.match(quote, /executionQuoteReviewReasons/);
  assert.match(quote, /review_required: true/);
  assert.match(quote, /truth\.execution_method === "ron"/);
  assert.match(quote, /mobile: legacy\.mobile/);
});

test("migration repairs live payment status, discount amount and due-at drift", () => {
  assert.match(migration, /add column if not exists discount_amount/i);
  assert.match(migration, /add column if not exists execution_truth jsonb/i);
  assert.match(migration, /add column if not exists due_at timestamptz/i);
  assert.match(migration, /generated always as \(sla_deadline\) stored/i);
  assert.match(migration, /alter column payment_status set default 'unpaid'/i);
  assert.match(migration, /'unpaid'/i);
  assert.match(migration, /'pending'/i);
  assert.doesNotMatch(
    migration,
    /update\s+public\.deals[\s\S]*payment_status\s*=\s*'unpaid'/i,
  );
});
