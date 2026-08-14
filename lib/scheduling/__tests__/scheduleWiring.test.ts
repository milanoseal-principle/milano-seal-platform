import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pipelineBoard = readFileSync("components/dashboard/pipeline-board.tsx", "utf8");
const dealPage = readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
const scheduleRoute = readFileSync("app/api/deals/[id]/schedule/route.ts", "utf8");
const executeRoute = readFileSync("app/api/deals/[id]/execute/route.ts", "utf8");
const drawer = readFileSync("components/dashboard/MatterDetailDrawer.tsx", "utf8");

test("pipeline board routes scheduled through the canonical schedule endpoint", () => {
  assert.match(pipelineBoard, /stage === "scheduled"[\s\S]*\/api\/deals\/\$\{deal_id\}\/schedule/);
});

test("deal detail routes scheduling and execution through governed endpoints", () => {
  assert.match(dealPage, /postProtectedAction\("schedule"/);
  assert.match(dealPage, /postProtectedAction\("execute"/);
  assert.match(dealPage, /\/api\/deals\/\$\{deal\.id\}\/\$\{path\}/);
  assert.doesNotMatch(dealPage, /moveStage\("scheduled"/);
  assert.doesNotMatch(dealPage, /moveStage\("in_execution"/);
});

test("canonical schedule endpoint authenticates and authorizes before privileged read", () => {
  const auth = scheduleRoute.indexOf("ssr.auth.getUser()");
  const role = scheduleRoute.indexOf("resolveServerRole(user)");
  const read = scheduleRoute.indexOf('.from("deals")');
  const executionGate = scheduleRoute.indexOf("validateExecutionTruth");
  const paymentGate = scheduleRoute.indexOf("evaluateSchedulingGate");
  assert.ok(auth > -1);
  assert.ok(role > auth);
  assert.ok(read > role);
  assert.ok(executionGate > read);
  assert.ok(paymentGate > executionGate);
  assert.match(scheduleRoute, /UNAUTHENTICATED/);
  assert.match(scheduleRoute, /FORBIDDEN/);
  assert.doesNotMatch(scheduleRoute, /payment_confirmed\s*:\s*true/);
});

test("canonical execute endpoint authenticates and authorizes before privileged read", () => {
  const auth = executeRoute.indexOf("ssr.auth.getUser()");
  const role = executeRoute.indexOf("resolveServerRole(user)");
  const read = executeRoute.indexOf('.from("deals")');
  const paymentGate = executeRoute.indexOf("assertPaymentConfirmed");
  assert.ok(auth > -1);
  assert.ok(role > auth);
  assert.ok(read > role);
  assert.ok(paymentGate > read);
  assert.match(executeRoute, /UNAUTHENTICATED/);
  assert.match(executeRoute, /FORBIDDEN/);
});

test("matter drawer has no manual payment-confirm mutation", () => {
  assert.doesNotMatch(drawer, /\/confirm-payment/);
  assert.doesNotMatch(drawer, />\s*Confirm Payment\s*</);
  assert.match(drawer, /verified Wise reconciliation/);
});
