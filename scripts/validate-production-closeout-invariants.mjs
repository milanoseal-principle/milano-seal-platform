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

// Dispatch is now a governed persistence layer over the canonical Matter; it
// may not create a second Matter lifecycle or fabricate queued/escalated state.
const dispatchMigration = read("supabase/migrations/075_governed_dispatch_and_alliance_webhooks.sql");
assert.match(dispatchMigration, /create table if not exists public\.dispatch_requests/);
assert.match(dispatchMigration, /matter_id uuid not null references public\.deals\(id\)/);
assert.match(dispatchMigration, /create_dispatch_request/);
assert.match(dispatchMigration, /assign_dispatch_request/);
assert.match(dispatchMigration, /escalate_dispatch_request/);
assert.match(dispatchMigration, /transition_dispatch_assignment/);
assert.match(dispatchMigration, /matter_events/);
assert.match(dispatchMigration, /revoke all on public\.dispatch_requests from anon, authenticated/);

const dispatchSources = [
  read("app/api/dispatch/jobs/route.ts"),
  read("app/api/dispatch/jobs/[id]/route.ts"),
  read("app/api/dispatch/request/route.ts"),
  read("app/api/dispatch/assign/route.ts"),
  read("app/api/dispatch/reassign/route.ts"),
  read("app/api/dispatch/escalate/route.ts"),
];
for (const source of dispatchSources) {
  assert.doesNotMatch(source, /disp_stub_/);
  assert.doesNotMatch(source, /reassignment_queued/);
  assert.doesNotMatch(source, /UNASSIGNED_STAGED/);
  assert.doesNotMatch(source, /DISPATCH_NOT_CONFIGURED/);
}
assert.match(dispatchSources[0], /requireDispatchOperator/);
assert.match(dispatchSources[2], /create_dispatch_request/);
assert.match(dispatchSources[3], /assign_dispatch_request/);
assert.match(dispatchSources[4], /assign_dispatch_request/);
assert.match(dispatchSources[5], /escalate_dispatch_request/);

// Alliance webhooks are authenticated evidence-only observations. They must not
// author Matter/payment/execution/RON/apostille/custody/release lifecycle state.
const allianceWebhookHelper = read("lib/alliance/webhookEvidence.ts");
assert.match(allianceWebhookHelper, /ALLIANCE_WEBHOOK_SECRET/);
assert.match(allianceWebhookHelper, /createHmac\(["']sha256["']/);
assert.match(allianceWebhookHelper, /timingSafeEqual/);
assert.match(allianceWebhookHelper, /alliance_webhook_events/);
assert.match(allianceWebhookHelper, /evidence_only:\s*true/);
for (const forbidden of [
  /\.from\(["']deals["']\)\.update/,
  /payment_confirmed\s*:/,
  /deal_status\s*:/,
  /is_paid_and_released\s*:/,
  /notarial_act\s*:/,
]) {
  assert.doesNotMatch(allianceWebhookHelper, forbidden);
}
for (const path of [
  "app/api/webhooks/alliance/job/route.ts",
  "app/api/webhooks/alliance/toolbelt/route.ts",
  "app/api/webhooks/alliance/credential/route.ts",
]) {
  const source = read(path);
  assert.match(source, /recordAllianceWebhookEvent/);
  assert.doesNotMatch(source, /console\.log/);
  assert.doesNotMatch(source, /status:\s*["']queued["']/);
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
for (const label of ["Why", "What must happen", "Who can resolve it", "Next action"]) {
  assert.ok(executionReadiness.includes(label), `Execution blocker guidance missing ${label}`);
}

// Canonical operational payment provider remains Wise-only.
const runtimePolicy = read("lib/workbook/runtimePolicy.ts");
assert.match(runtimePolicy, /PROHIBITED_OPERATIONAL_PAYMENT_PROVIDERS/);
assert.match(runtimePolicy, /["']stripe["']/i);
assert.match(runtimePolicy, /wise/i);

console.log("PASS production closeout invariants");
