import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gateSource = readFileSync("lib/pre-execution/executionGates.ts", "utf8");
const uiSource = readFileSync("components/dashboard/execution/ExecutionReadiness.tsx", "utf8");

test("execution payment gate describes scheduling authority rather than asserting paid settlement", () => {
  assert.match(gateSource, /payment: "Payment \/ Scheduling Authority"/);
  assert.doesNotMatch(gateSource, /payment: "Payment Confirmed"/);
});

test("execution blocker UI answers why what who and next action", () => {
  assert.match(uiSource, /"Why"/);
  assert.match(uiSource, /"What must happen"/);
  assert.match(uiSource, /"Who can resolve it"/);
  assert.match(uiSource, /"Next action"/);
  assert.match(uiSource, /First governed blocker/);
});

test("execution readiness keeps receiving-authority and notarial boundaries fail closed", () => {
  assert.match(uiSource, /do not infer legal or receiving-authority sufficiency/i);
  assert.match(uiSource, /without guaranteeing destination acceptance/i);
  assert.match(uiSource, /notarial act/);
});

test("execution readiness remains projection-only", () => {
  assert.doesNotMatch(uiSource, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/);
  assert.match(uiSource, /No gate can be bypassed/);
});
