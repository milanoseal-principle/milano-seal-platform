import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pipelineBoard = readFileSync("components/dashboard/pipeline-board.tsx", "utf8");
const dealActions = readFileSync("components/dashboard/deal-detail-actions.tsx", "utf8");
const scheduleRoute = readFileSync("app/api/deals/[id]/schedule/route.ts", "utf8");

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
  assert.match(dealActions, /postScheduledAction\("schedule"/);
  assert.match(dealActions, /\/api\/deals\/\$\{id\}\/\$\{path\}/);
});

test("canonical schedule endpoint evaluates the scheduling gate (payment OR complimentary)", () => {
  assert.match(scheduleRoute, /evaluateSchedulingGate/);
  assert.match(scheduleRoute, /paymentRequirementMethod/);
  // Never flips paymentConfirmed / creates a Wise event.
  assert.ok(!/payment_confirmed\s*:\s*true/.test(scheduleRoute));
});
