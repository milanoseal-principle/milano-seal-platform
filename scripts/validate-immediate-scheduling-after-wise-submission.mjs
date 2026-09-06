#!/usr/bin/env node
import { readFileSync } from "node:fs";

const gate = readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const guards = readFileSync("lib/bluenotary/guards.ts", "utf8");
const readiness = readFileSync("components/ron/MatterRONReadiness.tsx", "utf8");
const alerts = readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");

const checks = [
  ["observed Wise submission authorizes scheduling", /wise_submission_observed/.test(gate) && /authorizes scheduling while settlement remains pending/.test(gate)],
  ["BlueNotary creation uses scheduling authority", /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/.test(guards)],
  ["BlueNotary does not require verified settlement for session creation", !/assertCanCreateRONSession[\s\S]*await verifyPaymentConfirmed/.test(guards)],
  ["RON UI exposes submitted scheduling authority", /Wise submitted · scheduling authorized/.test(readiness)],
  ["operator processing note authorizes scheduling now", /Scheduling payment authority is satisfied now/.test(alerts)],
  ["operator note preserves settlement pending truth", /Wise processing \/ settlement pending/.test(alerts)],
  ["stale settlement-first scheduling copy removed", !/Scheduling will unlock only after verified settlement/.test(alerts)],
  ["final release remains settlement protected", /settlement-dependent final release remains protected/.test(alerts)],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS ${label}`);
  else { console.error(`FAIL ${label}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`Immediate Wise scheduling authority: ${checks.length}/${checks.length} passed`);
