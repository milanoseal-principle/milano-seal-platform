import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const READ_MODEL = "lib/operator-intelligence/read-model.ts";
const API_ROUTE = "app/api/dashboard/operator-intelligence/route.ts";
const TODAY_PAGE = "app/today/page.tsx";
const STATE_MACHINE = "data/matter-state-machine.ts";
const EXECUTION_TRUTH = "lib/matter/executionTruth.ts";

for (const file of [READ_MODEL, API_ROUTE, TODAY_PAGE, STATE_MACHINE, EXECUTION_TRUTH]) {
  assert.ok(existsSync(file), `Milano Operator Intelligence required file missing: ${file}`);
}

const readModel = readFileSync(READ_MODEL, "utf8");
const apiRoute = readFileSync(API_ROUTE, "utf8");
const todayPage = readFileSync(TODAY_PAGE, "utf8");
const stateMachine = readFileSync(STATE_MACHINE, "utf8");
const executionTruth = readFileSync(EXECUTION_TRUTH, "utf8");

const REQUIRED_CLASSES = [
  "Payment Blocked",
  "Document Blocked",
  "Authority Review",
  "Scheduling Due",
  "Apostille Pending",
  "Courier Exception",
  "Release Ready",
  "Overdue Follow-Up",
];

for (const actionClass of REQUIRED_CLASSES) {
  assert.ok(readModel.includes(`"${actionClass}"`), `Missing operator action class: ${actionClass}`);
  assert.ok(todayPage.includes(`"${actionClass}"`), `/today missing action class: ${actionClass}`);
}

assert.ok(
  readModel.includes('from "@/data/matter-state-machine"'),
  "Operator intelligence must consume the canonical Matter state machine",
);
assert.ok(
  readModel.includes('from "@/lib/matter/executionTruth"'),
  "Operator intelligence must consume canonical execution truth",
);
assert.ok(
  readModel.includes('.from("deals")'),
  "Operator intelligence must read canonical deals/Matter truth",
);

const mutationPattern = /\.(?:insert|update|upsert|delete|rpc)\s*\(/;
assert.ok(!mutationPattern.test(readModel), "Operator intelligence read model must remain read-only");
assert.ok(!mutationPattern.test(apiRoute), "Operator intelligence API must remain read-only");
assert.ok(
  !/\bexport\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)\b/.test(apiRoute),
  "Operator intelligence API must expose GET only",
);

assert.ok(apiRoute.includes("requireDashboardAccess"), "Operator intelligence API must require dashboard access");
assert.ok(apiRoute.includes("loadOperatorIntelligence"), "Operator intelligence API must use the canonical read model");
assert.ok(todayPage.includes("requireDashboardAccess"), "/today must remain protected");
assert.ok(todayPage.includes("loadOperatorIntelligence"), "/today must derive live canonical Matter intelligence");
assert.ok(todayPage.includes("Read-only contextual command layer"), "/today must state its orchestration boundary");
assert.ok(!readModel.includes("export const MATTER_STATES"), "Operator layer must not redefine MATTER_STATES");
assert.ok(!readModel.includes("MATTER_ALLOWED_TRANSITIONS:"), "Operator layer must not define another transition table");
assert.ok(!readModel.includes("function canTransitionMatter"), "Operator layer must not create another transition engine");
assert.ok(readModel.includes("Rich canonical Matter columns are unavailable"), "Degraded canonical reads must be surfaced explicitly");
assert.ok(todayPage.includes("This is not an all-clear state"), "/today must fail closed on canonical read failure");

for (const state of [
  "deposit_confirmed",
  "scheduling_unlocked",
  "apostille_processing",
  "apostille_received",
  "final_payment_confirmed",
  "ready_for_release",
  "label_created",
  "in_transit",
  "delivered",
  "completed",
]) {
  assert.ok(stateMachine.includes(`"${state}"`), `Canonical Matter state missing: ${state}`);
}

for (const requirement of [
  "authentication_requirement",
  "execution_method",
  "notarization_requirement",
  "review_required",
]) {
  assert.ok(executionTruth.includes(requirement), `Canonical execution truth missing: ${requirement}`);
}

console.log(
  "PASS Milano Operator Intelligence: read-only contextual layer, 8 action classes, no second Matter engine",
);
