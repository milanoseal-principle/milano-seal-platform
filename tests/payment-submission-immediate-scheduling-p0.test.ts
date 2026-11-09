import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const schedulingGate = fs.readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const ronGuards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");
const ronReadiness = fs.readFileSync("components/ron/MatterRONReadiness.tsx", "utf8");
const alerts = fs.readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");

test("integrity-matched Wise submission authorizes scheduling separately from settlement", () => {
  assert.match(schedulingGate, /schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied"/);
  assert.match(schedulingGate, /Integrity-matched Wise submission authorizes scheduling only/);
});

test("BlueNotary session creation uses scheduling authority instead of verified settlement", () => {
  assert.match(ronGuards, /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/);
  assert.doesNotMatch(ronGuards, /assertCanCreateRONSession[\s\S]*await verifyPaymentConfirmed/);
  assert.match(ronReadiness, /Wise submitted · scheduling authorized/);
  assert.match(ronReadiness, /BlueNotary is waiting on execution truth—not another payment/);
});

test("processing alerts preserve scheduling-only authority without inventing paid truth", () => {
  assert.match(alerts, /Confirm the canonical scheduling gate before scheduling/);
  assert.match(alerts, /BlueNotary execution requires server-side Wise provider evidence/);
  assert.match(alerts, /Wise processing \/ settlement pending/);
  assert.match(alerts, /Do not represent the Matter as paid or settled/);
  assert.doesNotMatch(alerts, /without waiting for Wise settlement/);
});

test("client copy distinguishes scheduling observation from settlement", () => {
  assert.match(alerts, /An integrity-matched submission can authorize scheduling/);
  assert.match(alerts, /settlement-dependent final release remains protected until Wise settlement is verified/);
});
