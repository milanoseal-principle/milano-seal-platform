#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");
const spine = readFileSync("components/dashboard/MatterExecutionCorridorSpine.tsx", "utf8");
const executive = readFileSync("app/dashboard/executive/page.tsx", "utf8");

for (const group of ["Matter", "Execution", "Corridor"]) {
  assert.ok(shell.includes(`group: \"${group}\"`), `Operator navigation missing ${group} group`);
}

assert.ok(shell.includes('eyebrow="Matter · Execution · Corridor"'), "Operator shell must expose the three-part operating spine");
assert.ok(shell.includes('/dashboard/professional360'), "Professional360 must remain available as a supporting intelligence lens");
assert.ok(shell.includes('/dashboard/economics'), "Economics must remain available as a supporting intelligence lens");
assert.ok(shell.includes('/dashboard/recovery'), "Recovery must remain available without becoming a second execution engine");
assert.ok(shell.includes('/dashboard/corridors'), "Corridor Command must be directly navigable");

assert.match(spine, /Matter/);
assert.match(spine, /Execution/);
assert.match(spine, /Corridor/);
assert.match(spine, /Everything else is a read-only or supporting intelligence lens/);
assert.match(spine, /useReducedMotion/);
assert.doesNotMatch(spine, /setInterval|particles|three|WebGL/i);

assert.ok(executive.includes("MatterExecutionCorridorSpine"), "Executive view must render the operating spine");

for (const forbidden of [/stripe/i, /provider360/i, /liaison\s*os/i]) {
  assert.ok(!forbidden.test(shell), `Operator spine leaked forbidden dependency: ${forbidden}`);
  assert.ok(!forbidden.test(spine), `Executive spine leaked forbidden dependency: ${forbidden}`);
}

console.log("PASS Matter → Execution → Corridor operating spine");
