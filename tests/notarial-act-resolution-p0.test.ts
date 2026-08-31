import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const intake = read("app/dashboard/intake/page.tsx");
const intakeCore = read("app/api/intake/core.ts");
const route = read("app/api/dashboard/matters/[id]/execution-truth/route.ts");
const readiness = read("components/ron/MatterRONReadiness.tsx");
const resolution = read("components/ron/NotarialActResolution.tsx");

test("Milano operator intake captures notarial act as canonical execution truth", () => {
  assert.match(intake, /notarial_act:\s*z\.enum/);
  assert.match(intake, /notarial_act:\s*values\.notarial_act/);
  assert.match(intakeCore, /typeof raw\.notarial_act === "string"/);
});

test("legacy intake remains fail-closed instead of inferring acknowledgment or jurat", () => {
  assert.match(intakeCore, /notarial_act:\s*"review_required"/);
  assert.doesNotMatch(intakeCore, /document_type[\s\S]{0,400}(acknowledgment|jurat)/i);
});

test("operator notarial act resolution is authenticated and role governed", () => {
  assert.match(route, /ssr\.auth\.getUser\(\)/);
  assert.match(route, /canPerformProtectedMatterTransition/);
  assert.match(route, /INVALID_NOTARIAL_ACT/);
  assert.match(route, /STALE_MATTER_STATE/);
});

test("resolution updates only canonical execution truth and never payment truth", () => {
  assert.match(route, /execution_truth:\s*nextTruth/);
  assert.match(route, /notarial_act:\s*notarialAct/);
  assert.doesNotMatch(route, /payment_confirmed\s*:/);
  assert.doesNotMatch(route, /payment_status\s*:/);
  assert.doesNotMatch(route, /amount_paid\s*:/);
});

test("RON UX makes payment-passed and the real execution blocker visually explicit", () => {
  assert.match(readiness, /Payment gate passed/);
  assert.match(readiness, /BlueNotary is waiting on execution truth—not another payment/);
  assert.match(readiness, /NotarialActResolution/);
  assert.match(resolution, /Payment is not the blocker\./);
  assert.match(resolution, /system never chooses acknowledgment versus jurat from the document title alone/i);
});
