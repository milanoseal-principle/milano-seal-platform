import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scheduling = readFileSync("app/dashboard/scheduling-readiness/page.tsx", "utf8");
const notifications = readFileSync("app/dashboard/notifications/page.tsx", "utf8");
const completion = readFileSync("app/dashboard/completion/page.tsx", "utf8");
const apostille = readFileSync("app/dashboard/apostille/page.tsx", "utf8");
const shell = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");

test("scheduling readiness projects the canonical gate instead of creating a second authority", () => {
  assert.match(scheduling, /evaluateSchedulingGate/);
  assert.match(scheduling, /allOperationalRequirementsPassed/);
  assert.match(scheduling, /wiseSubmission === "processing"/);
  assert.match(scheduling, /Wise processing · scheduling locked until verified settlement/);
  assert.doesNotMatch(scheduling, /scheduling authorized/);
  assert.doesNotMatch(scheduling, /payment_confirmed\s*:\s*true/);
  assert.doesNotMatch(scheduling, /\.update\(/);
  assert.doesNotMatch(scheduling, /\.insert\(/);
});

test("operator notification center reads the existing audit log without duplicating notification truth", () => {
  assert.match(notifications, /from\("notifications"\)/);
  assert.match(notifications, /Notification Center/);
  assert.match(notifications, /Delivery evidence remains provider-backed/);
  assert.doesNotMatch(notifications, /\.update\(/);
  assert.doesNotMatch(notifications, /\.insert\(/);
});

test("completion desk remains fail-closed on delivery and client-notification evidence", () => {
  assert.match(completion, /state === "delivered"/);
  assert.match(completion, /deliveryEvidence/);
  assert.match(completion, /clientNotified/);
  assert.match(completion, /Ready to Close/);
  assert.match(completion, /existing governed Matter transition/);
  assert.doesNotMatch(completion, /\.update\(/);
  assert.doesNotMatch(completion, /\.insert\(/);
});

test("apostille desk preserves canonical operational read while adding mobile execution hierarchy", () => {
  assert.match(apostille, /resolveOperationalMatterState/);
  assert.match(apostille, /Apostille Authentication Desk/);
  assert.match(apostille, /Action Required/);
  assert.match(apostille, /Next Expected Event/);
  assert.match(apostille, /md:hidden/);
  assert.doesNotMatch(apostille, /\.update\(/);
});

test("operator navigation exposes the continuous execution journey", () => {
  for (const route of [
    "/dashboard/notifications",
    "/dashboard/scheduling-readiness",
    "/dashboard/ron",
    "/dashboard/apostille",
    "/dashboard/releases",
    "/dashboard/completion",
  ]) {
    assert.match(shell, new RegExp(route.replaceAll("/", "\\/")));
  }
});
