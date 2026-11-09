import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const intake = read("app/dashboard/intake/page.tsx");
const intakeCore = read("app/api/intake/core.ts");
const route = read("app/api/dashboard/matters/[id]/execution-truth/route.ts");
const atomicMigration = read("supabase/migrations/074_atomic_execution_courier_alliance.sql");
const readiness = read("components/ron/MatterRONReadiness.tsx");
const resolution = read("components/ron/NotarialActResolution.tsx");
const executionPage = read("app/dashboard/matters/[matterId]/execution/page.tsx");
const signingRoom = read("app/dashboard/ron/page.tsx");
const sessionDetail = read("app/dashboard/ron/[session_id]/page.tsx");
const schedulingConsole = read("app/dashboard/scheduling-readiness/page.tsx");
const operatorIntelligence = read("lib/operator-intelligence/read-model.ts");
const schedulingGate = read("lib/scheduling/complimentarySchedulingGate.ts");

const OBSERVATION_FIELDS = [
  "payment_observed_amount",
  "payment_observed_currency",
  "payment_observed_reference",
  "currency",
  "wise_reference",
];

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
  assert.match(route, /p_expected_updated_at: matter\.updated_at/);
  assert.match(atomicMigration, /where id = p_matter_id for update/);
  assert.match(atomicMigration, /STALE_MATTER_STATE/);
});

test("notarial confirmation writes canonical execution truth plus governed Matter evidence", () => {
  assert.match(route, /confirm_matter_notarial_act/);
  assert.match(route, /p_notarial_act:\s*notarialAct/);
  assert.doesNotMatch(route, /appendMatterEvidence/);
  assert.match(atomicMigration, /NOTARIAL_ACT_CONFIRMED/);
  assert.match(atomicMigration, /'execution', 'operator'/);
  assert.match(atomicMigration, /to_jsonb\(v_prior_act\), to_jsonb\(p_notarial_act\)/);
});

test("notarial resolution never authors payment truth", () => {
  assert.doesNotMatch(route, /payment_confirmed\s*:/);
  assert.doesNotMatch(route, /payment_status\s*:/);
  assert.doesNotMatch(route, /amount_paid\s*:/);
  assert.doesNotMatch(route, /wise_transaction_reference\s*:/);
});

test("RON UX distinguishes Wise submission verified payment and complimentary authority", () => {
  assert.doesNotMatch(readiness, /Wise submitted · scheduling authorized/);
  assert.match(readiness, /verified_payment/);
  assert.match(readiness, /courtesy authorization cannot satisfy/);
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

test('submission cannot satisfy the shared settlement scheduling gate', () => {
  assert.match(schedulingGate, /evaluatePaymentGate/);
  assert.match(schedulingGate, /PAYMENT_CONFIRMED/);
  assert.doesNotMatch(schedulingGate, /submission === ["']observed["']/);
});

test("every RON scheduling and command-center projection carries observation integrity fields", () => {
  for (const [name, source] of [
    ["Matter RON readiness", readiness],
    ["Signing Room", signingRoom],
    ["RON session detail", sessionDetail],
    ["Scheduling console", schedulingConsole],
    ["Operator Intelligence", operatorIntelligence],
  ] as const) {
    for (const field of OBSERVATION_FIELDS) {
      assert.match(source, new RegExp(field), `${name} must project ${field}`);
    }
  }
  assert.match(operatorIntelligence, /payment_observed_at/);
  assert.match(operatorIntelligence, /payment_settlement_status/);
  assert.match(operatorIntelligence, /evaluateSchedulingGate/);
});

test("global Signing Room uses Milano visual hierarchy and truthful next-action copy", () => {
  assert.match(signingRoom, /BlueNotary Signing Room/);
  assert.match(signingRoom, /Payment is not the blocker/);
  assert.match(signingRoom, /Never inferred from document title/);
  assert.match(signingRoom, /No hover required/);
  assert.match(signingRoom, /Open RON Readiness → Create BlueNotary Session/);
  assert.match(signingRoom, /Open RON Readiness → Resolve Blockers/);
});
