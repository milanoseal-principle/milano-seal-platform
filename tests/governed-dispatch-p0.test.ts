import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Production-regression contract for PR #327 transaction + dispatch readiness.
const read = (path: string) => readFileSync(path, "utf8");

const migration = read("supabase/migrations/075_governed_dispatch_and_alliance_webhooks.sql");
const requestRoute = read("app/api/dispatch/request/route.ts");
const queueRoute = read("app/api/dispatch/jobs/route.ts");
const detailRoute = read("app/api/dispatch/jobs/[id]/route.ts");
const assignRoute = read("app/api/dispatch/assign/route.ts");
const reassignRoute = read("app/api/dispatch/reassign/route.ts");
const escalateRoute = read("app/api/dispatch/escalate/route.ts");
const allianceAction = read("app/api/alliance/jobs/[id]/action/route.ts");
const webhookEvidence = read("lib/alliance/webhookEvidence.ts");

test("dispatch persistence remains linked to canonical Matter truth", () => {
  assert.match(migration, /dispatch_requests/);
  assert.match(migration, /matter_id uuid not null references public\.deals\(id\)/);
  assert.match(migration, /operator_assignments/);
  assert.match(migration, /matter_events/);
  assert.doesNotMatch(migration, /create table[^;]*(matter|payment|settlement|ron|apostille|release)_state/i);
});

test("dispatch mutation routes require governed operator authorization", () => {
  for (const source of [requestRoute, queueRoute, detailRoute, assignRoute, reassignRoute, escalateRoute]) {
    assert.match(source, /requireDispatchOperator/);
    assert.doesNotMatch(source, /DISPATCH_NOT_CONFIGURED/);
  }
});

test("dispatch creation, assignment and escalation use atomic RPC authorities", () => {
  assert.match(requestRoute, /create_dispatch_request/);
  assert.match(assignRoute, /assign_dispatch_request/);
  assert.match(reassignRoute, /assign_dispatch_request/);
  assert.match(escalateRoute, /escalate_dispatch_request/);
  assert.match(allianceAction, /transition_dispatch_assignment/);
});

test("Alliance webhook input is signed, replay bounded, durable and evidence only", () => {
  assert.match(webhookEvidence, /ALLIANCE_WEBHOOK_SECRET/);
  assert.match(webhookEvidence, /x-milano-alliance-timestamp/);
  assert.match(webhookEvidence, /x-milano-alliance-event-id/);
  assert.match(webhookEvidence, /x-milano-alliance-signature/);
  assert.match(webhookEvidence, /timingSafeEqual/);
  assert.match(webhookEvidence, /MAX_SKEW_SECONDS = 300/);
  assert.match(webhookEvidence, /alliance_webhook_events/);
  assert.match(webhookEvidence, /evidence_only: true/);
  assert.doesNotMatch(webhookEvidence, /\.from\("deals"\)\s*\.update/);
  assert.doesNotMatch(webhookEvidence, /payment_confirmed\s*:/);
  assert.doesNotMatch(webhookEvidence, /is_paid_and_released\s*:/);
});

test("dispatch and Alliance surfaces contain no fabricated success markers", () => {
  for (const source of [requestRoute, queueRoute, detailRoute, assignRoute, reassignRoute, escalateRoute, webhookEvidence]) {
    assert.doesNotMatch(source, /disp_stub_/);
    assert.doesNotMatch(source, /reassignment_queued/);
    assert.doesNotMatch(source, /UNASSIGNED_STAGED/);
  }
});
