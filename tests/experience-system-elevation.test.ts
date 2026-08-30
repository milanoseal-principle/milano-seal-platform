import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scheduling = readFileSync("app/dashboard/scheduling-readiness/page.tsx", "utf8");
const notifications = readFileSync("app/dashboard/notifications/page.tsx", "utf8");
const completion = readFileSync("app/dashboard/completion/page.tsx", "utf8");
const apostille = readFileSync("app/dashboard/apostille/page.tsx", "utf8");
const shell = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");
const portalRail = readFileSync("components/portal/portal-status-rail.tsx", "utf8");
const motion = readFileSync("components/motion/MilanoMotion.tsx", "utf8");
const motionPresets = readFileSync("lib/motion/milanoMotionPresets.ts", "utf8");

test("scheduling readiness projects the canonical gate instead of creating a second authority", () => {
  assert.match(scheduling, /evaluateSchedulingGate/);
  assert.match(scheduling, /allOperationalRequirementsPassed/);
  assert.match(scheduling, /wise_submission_observed/);
  assert.match(scheduling, /Wise processing · scheduling authorized/);
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

test("operator shell adds a cinematic navigation rail without claiming Matter state", () => {
  assert.match(shell, /EXECUTION_RAIL/);
  assert.match(shell, /Execution Path/);
  assert.match(shell, /Navigation context only/);
  assert.match(shell, /canonical Matter truth remains authoritative/);
  assert.doesNotMatch(shell, /payment_confirmed\s*:/);
  assert.doesNotMatch(shell, /\.update\(/);
  assert.doesNotMatch(shell, /\.insert\(/);
});

test("portal journey motion remains derived from canonical status and payment inputs", () => {
  assert.match(portalRail, /resolveStepIndex/);
  assert.match(portalRail, /resolvePortalLifecycleSummary/);
  assert.match(portalRail, /paymentStatus/);
  assert.match(portalRail, /Truth-backed · no inferred success states/);
  assert.match(portalRail, /useReducedMotion/);
  assert.doesNotMatch(portalRail, /\.update\(/);
  assert.doesNotMatch(portalRail, /\.insert\(/);
  assert.doesNotMatch(portalRail, /fetch\(/);
});

test("shared Milano motion system is accessibility-aware and presentation-only", () => {
  assert.match(motion, /useReducedMotion/);
  assert.match(motion, /MilanoReveal/);
  assert.match(motion, /MilanoStagger/);
  assert.match(motion, /MilanoStatusPulse/);
  assert.match(motion, /MilanoSealConfirm/);
  assert.match(motionPresets, /MILANO_EASE/);
  assert.match(motionPresets, /verified/);
  assert.match(motionPresets, /exception/);
  assert.doesNotMatch(motion, /supabase/i);
  assert.doesNotMatch(motion, /wise/i);
  assert.doesNotMatch(motion, /fetch\(/);
});
