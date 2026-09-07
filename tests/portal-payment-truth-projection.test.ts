import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("app/api/portal/me/matter-intelligence/route.ts", "utf8");

test("portal matter intelligence delegates scheduling authority to canonical scheduling gate", () => {
  assert.match(source, /evaluateSchedulingGate/);
  assert.match(source, /paymentRequirementMethod === "verified_payment"/);
  assert.match(source, /paymentRequirementMethod === "wise_submission_observed"/);
  assert.match(source, /schedulingUnlocked: scheduling\.schedulingEligible/);
});

test("legacy payment_confirmed lifecycle state is not treated as settled payment", () => {
  assert.doesNotMatch(source, /paymentStatus === "payment_confirmed"/);
  assert.doesNotMatch(source, /matterStatus === "payment_confirmed"/);
  assert.match(source, /Verified Wise settlement remains separate/);
});

test("client payment projection exposes submission settlement and scheduling as distinct truths", () => {
  assert.match(source, /settlementVerified/);
  assert.match(source, /submissionObserved/);
  assert.match(source, /schedulingMethod/);
  assert.match(source, /schedulingReason/);
});

test("payment milestone copy does not overstate settlement", () => {
  assert.match(source, /PAYMENT_CONFIRMED: "Payment evidence recorded"/);
  assert.doesNotMatch(source, /PAYMENT_CONFIRMED: "Payment confirmed"/);
});
