import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const schedulingGate = fs.readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const ronGuards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");
const ronReadiness = fs.readFileSync("components/ron/MatterRONReadiness.tsx", "utf8");
const alerts = fs.readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");

test("observed Wise submission cannot satisfy scheduling payment authority", () => {
  assert.match(schedulingGate, /schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied"/);
  assert.match(schedulingGate, /scheduling remains locked until verified Wise settlement/);
});

test("BlueNotary session creation uses scheduling authority instead of verified settlement", () => {
  assert.match(ronGuards, /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/);
  assert.doesNotMatch(ronGuards, /assertCanCreateRONSession[\s\S]*await verifyPaymentConfirmed/);
  assert.match(ronReadiness, /Wise submitted · scheduling locked/);
  assert.match(ronReadiness, /BlueNotary is waiting on execution truth—not another payment/);
});

test("processing alerts keep scheduling locked without inventing paid truth", () => {
  assert.match(alerts, /Scheduling will unlock only after verified settlement/);
  assert.match(alerts, /Do not schedule or begin BlueNotary execution before verified Wise settlement/);
  assert.match(alerts, /Wise processing \/ settlement pending/);
  assert.match(alerts, /Do not represent the Matter as paid or settled/);
  assert.doesNotMatch(alerts, /without waiting for Wise settlement/);
});

test("client copy keeps scheduling locked until settlement", () => {
  assert.match(alerts, /Scheduling remains locked until verified Wise settlement/);
  assert.match(alerts, /settlement-dependent final release remains protected until Wise settlement is verified/);
});
