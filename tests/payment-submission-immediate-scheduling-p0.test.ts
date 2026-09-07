import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const schedulingGate = fs.readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const ronGuards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");
const ronReadiness = fs.readFileSync("components/ron/MatterRONReadiness.tsx", "utf8");
const alerts = fs.readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");

test("observed Wise submission immediately satisfies scheduling payment authority", () => {
  assert.match(schedulingGate, /paymentRequirementMethod:\s*"wise_submission_observed"/);
  assert.match(schedulingGate, /Observed Wise submission authorizes scheduling while settlement remains pending/);
});

test("BlueNotary session creation uses scheduling authority instead of verified settlement", () => {
  assert.match(ronGuards, /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/);
  assert.doesNotMatch(ronGuards, /assertCanCreateRONSession[\s\S]*await verifyPaymentConfirmed/);
  assert.match(ronReadiness, /Wise submitted · scheduling authorized/);
  assert.match(ronReadiness, /BlueNotary is waiting on execution truth—not another payment/);
});

test("processing alerts tell operators scheduling is authorized without inventing paid truth", () => {
  assert.match(alerts, /Scheduling payment authority is satisfied now/);
  assert.match(alerts, /Continue scheduling and BlueNotary readiness without waiting for Wise settlement/);
  assert.match(alerts, /Wise processing \/ settlement pending/);
  assert.match(alerts, /Do not represent the Matter as paid or settled/);
  assert.doesNotMatch(alerts, /Scheduling will unlock only after verified settlement/);
});

test("client copy separates immediate scheduling from final settlement-dependent release", () => {
  assert.match(alerts, /Scheduling authority is now available while Wise settlement continues separately in the background/);
  assert.match(alerts, /settlement-dependent final release remains protected until Wise settlement is verified/);
});
