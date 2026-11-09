#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const gate = readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const guards = readFileSync("lib/bluenotary/guards.ts", "utf8");
const readiness = readFileSync("components/ron/MatterRONReadiness.tsx", "utf8");
const alerts = readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");

const checks = [
  ["only integrity-matched observation authorizes scheduling", /Integrity-matched Wise submission authorizes scheduling only/.test(gate) && /paymentRequirementMethod: "wise_submission_observed"/.test(gate)],
  ["BlueNotary creation uses scheduling authority", /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/.test(guards)],
  ["BlueNotary delegates to the strict shared settlement gate", !/assertCanCreateRONSession[\s\S]*await verifyPaymentConfirmed/.test(guards)],
  ["RON UI exposes submitted scheduling authority", /Wise submitted · scheduling authorized/.test(readiness)],
  ["operator processing note preserves provider execution gate", /BlueNotary execution requires server-side Wise provider evidence/.test(alerts)],
  ["operator note preserves settlement pending truth", /Wise processing \/ settlement pending/.test(alerts)],
  ["pre-settlement authorization copy removed", !/without waiting for Wise settlement/.test(alerts)],
  ["final release remains settlement protected", /settlement-dependent final release remains protected/.test(alerts)],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS ${label}`);
  else { console.error(`FAIL ${label}`); failed += 1; }
}
if (failed) process.exit(1);
// Keep the historical entry point so existing deployment wiring remains intact.
const behavioral = spawnSync(process.execPath, ["--import", "tsx", "--test",
  "tests/unit/schedulingPaymentGate.test.ts", "tests/unit/verifiedSettlementLifecycle.test.ts"], { stdio: "inherit" });
if (behavioral.status !== 0) process.exit(behavioral.status ?? 1);
console.log(`Separated Wise scheduling authority: ${checks.length}/${checks.length} source checks and behavioral tests passed`);
