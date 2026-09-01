import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const intake = read("app/dashboard/intake/page.tsx");
const intakeCore = read("app/api/intake/core.ts");
const route = read("app/api/dashboard/matters/[id]/execution-truth/route.ts");
const readiness = read("components/ron/MatterRONReadiness.tsx");
const resolution = read("components/ron/NotarialActResolution.tsx");
const executionPage = read("app/dashboard/matters/[matterId]/execution/page.tsx");

test("Milano operator intake captures notarial act as canonical execution truth", () => {
  assert.match(intake, /notarial_act:\s*z\.enum/);
  assert.match(intake, /notarial_act:\s*values\.notarial_act/);
  assert.match(intakeCore, /typeof raw\.notarial_act === "string"/);
});

test("legacy intake remains fail-closed instead of inferring acknowledgment or jurat", () => {
  assert.match(intakeCore, /notarial_act:\s*"review_required"/);
  assert.doesNotMatch(intakeCore, /document_type[\s\S]{0,400}(acknowledgment|jurat)/i);
});

test("operator notarial act resolution is authenticated role governed and concurrency safe", () => {
  assert.match(route, /ssr\.auth\.getUser\(\)/);
  assert.match(route, /canPerformProtectedMatterTransition/);
  assert.match(route, /INVALID_NOTARIAL_ACT/);
  assert.match(route, /STALE_MATTER_STATE/);
  assert.match(route, /\.eq\("updated_at", matter\.updated_at\)/);
});

test("notarial confirmation writes canonical execution truth plus governed Matter evidence", () => {
  assert.match(route, /execution_truth:\s*nextTruth/);
  assert.match(route, /notarial_act:\s*notarialAct/);
  assert.match(route, /appendMatterEvidence/);
  assert.match(route, /NOTARIAL_ACT_CONFIRMED/);
  assert.match(route, /domain:\s*"execution"/);
  assert.match(route, /priorValue:\s*priorNotarialAct/);
  assert.match(route, /newValue:\s*notarialAct/);
});

test("notarial resolution never authors payment truth", () => {
  assert.doesNotMatch(route, /payment_confirmed\s*:/);
  assert.doesNotMatch(route, /payment_status\s*:/);
  assert.doesNotMatch(route, /amount_paid\s*:/);
  assert.doesNotMatch(route, /wise_transaction_reference\s*:/);
});

test("RON UX distinguishes Wise submission verified payment and complimentary authority", () => {
  assert.match(readiness, /wise_submission_observed/);
  assert.match(readiness, /verified_payment/);
  assert.match(readiness, /complimentary_authorization/);
  assert.match(readiness, /Payment is not the blocker/);
  assert.match(readiness, /BlueNotary is waiting on execution truth—not another payment/);
  assert.match(readiness, /NotarialActResolution/);
  assert.match(resolution, /Scheduling authority satisfied/);
  assert.match(resolution, /system never chooses acknowledgment versus jurat from the document title alone/i);
});

test("Matter execution page no longer renders an unwired placeholder gate ladder", () => {
  assert.doesNotMatch(executionPage, /<ExecutionReadiness\s*\/>/);
  assert.doesNotMatch(executionPage, /import \{ ExecutionReadiness \}/);
  assert.match(executionPage, /DynamicSessionPlaybook matterId=\{matterId\}/);
  assert.match(executionPage, /MatterRONReadiness matterId=\{matterId\}/);
  assert.match(executionPage, /Matter-backed operator readiness only/);
});
