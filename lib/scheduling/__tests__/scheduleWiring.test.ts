import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pipelineBoard = readFileSync("components/dashboard/pipeline-board.tsx", "utf8");
const dealPage = readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
const scheduleRoute = readFileSync("app/api/deals/[id]/schedule/route.ts", "utf8");
const executeRoute = readFileSync("app/api/deals/[id]/execute/route.ts", "utf8");
const protectedRoles = readFileSync("lib/auth/protectedMatterTransitions.ts", "utf8");

test("pipeline board routes 'scheduled' through the canonical schedule endpoint", () => {
  assert.match(pipelineBoard, /stage === "scheduled"[\s\S]*\/api\/deals\/\$\{deal_id\}\/schedule/);
});

test("pipeline board does NOT route scheduling through /api/admin/move", () => {
  // admin/move is still used for other stages, but the scheduled branch must not.
  const scheduledBranch = pipelineBoard.slice(
    pipelineBoard.indexOf('stage === "scheduled"'),
    pipelineBoard.indexOf('/api/admin/move'),
  );
  assert.ok(!/admin\/move/.test(scheduledBranch), "scheduled branch must not call admin/move");
});

test("deal-detail Schedule dialog uses the canonical schedule endpoint", () => {
  assert.match(dealPage, /postProtectedTransition\([\s\S]*"schedule"/);
  assert.match(dealPage, /\/api\/deals\/\$\{deal\.id\}\/\$\{action\}/);
});

test("deal-detail execution uses the governed execute endpoint", () => {
  assert.match(dealPage, /postProtectedTransition\("execute"/);
});

test("canonical schedule endpoint evaluates the scheduling gate (payment OR complimentary)", () => {
  assert.match(scheduleRoute, /evaluateSchedulingGate/);
  assert.match(scheduleRoute, /paymentRequirementMethod/);
  // Never flips paymentConfirmed / creates a Wise event.
  assert.ok(!/payment_confirmed\s*:\s*true/.test(scheduleRoute));
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
