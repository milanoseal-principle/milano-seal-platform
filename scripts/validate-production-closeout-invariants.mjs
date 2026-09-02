import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// Release-closeout regression guard. Source-only by design: no provider calls,
// no secrets, and no mutation authority. The Vercel merge gate executes it.
function read(path) {
  assert.ok(existsSync(path), `Required production source missing: ${path}`);
  return readFileSync(path, "utf8");
}

function absent(path, reason) {
  assert.ok(!existsSync(path), `${path} must remain absent: ${reason}`);
}

// One canonical Shippo mutation authority only.
absent(
  "app/api/webhooks/shippo/route.ts",
  "legacy shared-secret Shippo authority must not return",
);
const courierWebhook = read("app/api/courier/webhook/route.ts");
assert.match(courierWebhook, /verifyShippoHmac/);
assert.match(courierWebhook, /X-Shippo-Signature-HMAC-SHA256-V2/);
assert.match(courierWebhook, /record_courier_delivery_transition/);
assert.doesNotMatch(courierWebhook, /deal_status\s*:/);

// Retired fake-success Alliance status authority must stay removed.
absent(
  "app/api/webhooks/alliance/status/route.ts",
  "unverified Alliance status webhook must not return",
);

// Unconfigured dispatch / Alliance integration surfaces must fail closed.
const failClosedRoutes = [
  "app/api/dispatch/jobs/route.ts",
  "app/api/dispatch/jobs/[id]/route.ts",
  "app/api/dispatch/request/route.ts",
  "app/api/dispatch/reassign/route.ts",
  "app/api/dispatch/escalate/route.ts",
  "app/api/webhooks/alliance/job/route.ts",
  "app/api/webhooks/alliance/toolbelt/route.ts",
  "app/api/webhooks/alliance/credential/route.ts",
];

for (const path of failClosedRoutes) {
  const source = read(path);
  assert.match(source, /NOT_CONFIGURED/, `${path} must declare NOT_CONFIGURED`);
  assert.match(source, /status:\s*503/, `${path} must fail closed with HTTP 503`);
  assert.doesNotMatch(source, /disp_stub_/);
  assert.doesNotMatch(source, /reassignment_queued/);
  assert.doesNotMatch(source, /status:\s*["']escalated["']/);
  assert.doesNotMatch(source, /current_assignment_state:\s*["']UNASSIGNED_STAGED["']/);
  assert.doesNotMatch(source, /console\.log\([^\n]*webhook\/alliance/);
}

// Release evidence may never be fabricated from local/demo form values.
const releaseCertificates = read("app/dashboard/releases/certificates/page.tsx");
for (const forbidden of [
  "DEMO-MATTER-ID",
  "DEMO-VERIFICATION-ID",
  "MS-DEMO-HASH",
  "generateHash(",
  "Demo Client",
]) {
  assert.ok(!releaseCertificates.includes(forbidden), `Release certificate surface contains forbidden synthetic truth: ${forbidden}`);
}
assert.match(releaseCertificates, /Release Workspace|release workspace/i);

// Client payment projection must delegate scheduling authority to the canonical gate.
const portalMatter = read("app/api/portal/me/matter-intelligence/route.ts");
assert.match(portalMatter, /evaluateSchedulingGate/);
assert.match(portalMatter, /submissionObserved/);
assert.match(portalMatter, /settlementVerified/);
assert.match(portalMatter, /schedulingUnlocked/);
assert.match(portalMatter, /schedulingMethod/);
assert.match(portalMatter, /paidAndReleased/);
assert.doesNotMatch(portalMatter, /paymentStatus\s*===\s*["']payment_confirmed["']/);
assert.match(portalMatter, /Payment evidence recorded/);

// Corridor UNKNOWN evidence must remain distinct from an actual scale decision.
const corridor = read("lib/corridor/scale-engine.ts");
assert.match(corridor, /INSUFFICIENT_EVIDENCE/);
assert.match(corridor, /status\s*=\s*["']INSUFFICIENT_EVIDENCE["']/);
assert.doesNotMatch(
  corridor,
  /blockingUnknown[\s\S]{0,220}status\s*=\s*demand\s*===\s*["']LOW["']\s*\?\s*["']DO_NOT_SCALE["']\s*:\s*["']WATCH["']/,
);

// Execution UI must describe scheduling authority without claiming settlement.
const executionGates = read("lib/pre-execution/executionGates.ts");
const executionReadiness = read("components/dashboard/execution/ExecutionReadiness.tsx");
assert.match(executionGates, /payment:\s*["']Payment \/ Scheduling Authority["']/);
assert.doesNotMatch(executionGates, /payment:\s*["']Payment Confirmed["']/);
for (const label of ["WHY", "WHAT MUST HAPPEN", "WHO CAN RESOLVE", "NEXT ACTION"]) {
  assert.ok(executionReadiness.includes(label), `Execution blocker guidance missing ${label}`);
}

// Canonical operational payment provider remains Wise-only.
const runtimePolicy = read("lib/workbook/runtimePolicy.ts");
assert.match(runtimePolicy, /PROHIBITED_OPERATIONAL_PAYMENT_PROVIDERS/);
assert.match(runtimePolicy, /["']stripe["']/i);
assert.match(runtimePolicy, /wise/i);

console.log("PASS production closeout invariants");
