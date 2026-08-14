import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pipelineBoard = readFileSync("components/dashboard/pipeline-board.tsx", "utf8");
const dealPage = readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
const scheduleRoute = readFileSync("app/api/deals/[id]/schedule/route.ts", "utf8");
const executeRoute = readFileSync("app/api/deals/[id]/execute/route.ts", "utf8");
const protectedRoles = readFileSync("lib/auth/protectedMatterTransitions.ts", "utf8");
const scheduleRoute = readFileSync("app/api/deals/[id]/schedule/route.ts", "utf8");
const executeRoute = readFileSync("app/api/deals/[id]/execute/route.ts", "utf8");
const adminMoveRoute = readFileSync("app/api/admin/move/route.ts", "utf8");
const founderStatusRoute = readFileSync("app/api/admin/matters/[id]/status/route.ts", "utf8");
const protectedPolicy = readFileSync("lib/auth/protectedMatterTransitions.ts", "utf8");
const drawer = readFileSync("components/dashboard/MatterDetailDrawer.tsx", "utf8");

test("pipeline board routes scheduled through the canonical schedule endpoint", () => {
  assert.match(pipelineBoard, /stage === "scheduled"[\s\S]*\/api\/deals\/\$\{deal_id\}\/schedule/);
});

test("protected Matter transition policy excludes virtual assistants", () => {
  assert.match(protectedPolicy, /execution_coordinator/);
  assert.match(protectedPolicy, /apostille_coordinator/);
  assert.doesNotMatch(protectedPolicy, /virtual_assistant/);
  assert.match(scheduleRoute, /canPerformProtectedMatterTransition\(role\)/);
  assert.match(executeRoute, /canPerformProtectedMatterTransition\(role\)/);
});

test("deal-detail Schedule dialog uses the canonical schedule endpoint", () => {
  assert.match(dealPage, /postProtectedTransition\([\s\S]*"schedule"/);
  assert.match(dealPage, /\/api\/deals\/\$\{deal\.id\}\/\$\{action\}/);
});

test("deal-detail execution uses the governed execute endpoint", () => {
  assert.match(dealPage, /postProtectedTransition\("execute"/);
test("canonical schedule endpoint authenticates and authorizes before privileged read", () => {
  const auth = scheduleRoute.indexOf("ssr.auth.getUser()");
  const role = scheduleRoute.indexOf("resolveServerRole(user)");
  const read = scheduleRoute.indexOf('.from("deals")');
  const stateGate = scheduleRoute.indexOf("canTransition(currentStatus, \"scheduled\")");
  const executionGate = scheduleRoute.indexOf("validateExecutionTruth");
  const paymentGate = scheduleRoute.indexOf("evaluateSchedulingGate");
  assert.ok(auth > -1);
  assert.ok(role > auth);
  assert.ok(read > role);
  assert.ok(stateGate > read);
  assert.ok(executionGate > stateGate);
  assert.ok(paymentGate > executionGate);
  assert.match(scheduleRoute, /normalizedCurrent !== "awaiting_payment"/);
  assert.match(scheduleRoute, /UNAUTHENTICATED/);
  assert.match(scheduleRoute, /FORBIDDEN/);
  assert.match(scheduleRoute, /INVALID_STATE_TRANSITION/);
  assert.doesNotMatch(scheduleRoute, /payment_confirmed\s*:\s*true/);
});

test("schedule persists canonical scheduled_at, notes, and optimistic state guard", () => {
  assert.match(scheduleRoute, /scheduled_at:\s*scheduledAt/);
  assert.match(scheduleRoute, /notes:\s*nextNotes/);
  assert.match(scheduleRoute, /\.eq\("status", deal\.status\)/);
  assert.match(scheduleRoute, /\.eq\("deal_status", deal\.deal_status\)/);
  assert.match(scheduleRoute, /STALE_MATTER_STATE/);
});

test("schedule accepts UUID and public Matter identifiers", () => {
  assert.match(scheduleRoute, /UUID_RE/);
  assert.match(scheduleRoute, /id\.eq\.\$\{id\},deal_id\.eq\.\$\{id\}/);
  assert.match(scheduleRoute, /\.eq\("deal_id", id\)/);
});

test("canonical execute endpoint enforces exact state, execution truth, and payment-or-complimentary gate", () => {
  const auth = executeRoute.indexOf("ssr.auth.getUser()");
  const role = executeRoute.indexOf("resolveServerRole(user)");
  const read = executeRoute.indexOf('.from("deals")');
  const stateGate = executeRoute.indexOf("canTransition(currentStatus, \"in_execution\")");
  const executionGate = executeRoute.indexOf("validateExecutionTruth");
  const paymentGate = executeRoute.indexOf("evaluateSchedulingGate");
  assert.ok(auth > -1);
  assert.ok(role > auth);
  assert.ok(read > role);
  assert.ok(stateGate > read);
  assert.ok(executionGate > stateGate);
  assert.ok(paymentGate > executionGate);
  assert.match(executeRoute, /normalizedCurrent !== "scheduled"/);
  assert.match(executeRoute, /required_status:\s*"scheduled"/);
  assert.match(executeRoute, /PAYMENT_REQUIRED/);
});

test("execute advances both statuses, records executed_at, and rejects stale concurrent transitions", () => {
  assert.match(executeRoute, /status:\s*"in_execution"/);
  assert.match(executeRoute, /deal_status:\s*"in_execution"/);
  assert.match(executeRoute, /executed_at:\s*now/);
  assert.match(executeRoute, /execution_at:\s*now/);
  assert.match(executeRoute, /\.eq\("status", deal\.status\)/);
  assert.match(executeRoute, /\.eq\("deal_status", deal\.deal_status\)/);
  assert.match(executeRoute, /STALE_MATTER_STATE/);
});

test("legacy admin move cannot grant VA protected scheduling or execution authority", () => {
  assert.match(adminMoveRoute, /PROTECTED_STAGES/);
  assert.match(adminMoveRoute, /canPerformProtectedMatterTransition\(role\)/);
  assert.match(adminMoveRoute, /FORBIDDEN/);
});

test("founder generic status route cannot bypass dedicated scheduling or execution", () => {
  assert.match(founderStatusRoute, /DEDICATED_TRANSITIONS/);
  assert.match(founderStatusRoute, /USE_GOVERNED_TRANSITION_ENDPOINT/);
  assert.match(founderStatusRoute, /canTransition\(currentRaw, status\)/);
  assert.match(founderStatusRoute, /evaluateSchedulingGate/);
  assert.match(founderStatusRoute, /STALE_MATTER_STATE/);
  assert.match(founderStatusRoute, /resolveServerRole\(user\)/);
});

test("Matter drawer has no manual payment-confirm mutation", () => {
  assert.doesNotMatch(drawer, /\/confirm-payment/);
  assert.doesNotMatch(drawer, />\s*Confirm Payment\s*</);
  assert.match(drawer, /PaymentIntegrityPanel/);
});

test("protected transitions enforce canonical state order and timestamps", () => {
  assert.match(scheduleRoute, /canTransition\(deal\.status, "scheduled"\)/);
  assert.match(scheduleRoute, /scheduled_at: body\.scheduled_at/);
  assert.doesNotMatch(scheduleRoute, /execution_date: body\./);
  assert.match(executeRoute, /canTransition\(deal\.status, "in_execution"\)/);
  assert.match(executeRoute, /status: "in_execution"/);
  assert.match(executeRoute, /executed_at: now/);
  assert.match(scheduleRoute, /\.eq\("status", deal\.status\)/);
  assert.match(executeRoute, /\.eq\("status", deal\.status\)/);
});

test("canonical scheduling accepts the pipeline deal identifier without weakening UUID updates", () => {
  assert.match(scheduleRoute, /\.eq\("deal_id", id\)/);
  assert.match(scheduleRoute, /\.eq\("id", deal\.id\)/);
});

test("virtual assistants cannot perform protected Matter transitions", () => {
  assert.doesNotMatch(protectedRoles, /virtual_assistant/);
  assert.match(scheduleRoute, /canManageProtectedMatterTransition\(role\)/);
  assert.match(executeRoute, /canManageProtectedMatterTransition\(role\)/);
});
