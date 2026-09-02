import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dispatchFiles = [
  "app/api/dispatch/jobs/route.ts",
  "app/api/dispatch/request/route.ts",
  "app/api/dispatch/reassign/route.ts",
  "app/api/dispatch/escalate/route.ts",
  "app/api/dispatch/jobs/[id]/route.ts",
];

for (const file of dispatchFiles) {
  test(`${file} is governed and does not fabricate operational success`, () => {
    const source = readFileSync(file, "utf8");
    assert.match(source, /requireDispatchOperator/);
    assert.doesNotMatch(source, /DISPATCH_NOT_CONFIGURED/);
    assert.doesNotMatch(source, /disp_stub_/);
    assert.doesNotMatch(source, /reassignment_queued/);
    assert.doesNotMatch(source, /current_assignment_state:\s*["']UNASSIGNED_STAGED["']/);
    assert.doesNotMatch(source, /console\.log\(/);
  });
}

for (const file of [
  "app/api/webhooks/alliance/job/route.ts",
  "app/api/webhooks/alliance/toolbelt/route.ts",
  "app/api/webhooks/alliance/credential/route.ts",
]) {
  test(`${file} delegates to authenticated durable evidence recording`, () => {
    const source = readFileSync(file, "utf8");
    assert.match(source, /recordAllianceWebhookEvent/);
    assert.doesNotMatch(source, /status:\s*["']queued["']/);
    assert.doesNotMatch(source, /current_assignment_state:\s*["']UNASSIGNED_STAGED["']/);
    assert.doesNotMatch(source, /console\.log\(/);
  });
}

test("Alliance webhook helper remains fail closed when unconfigured or unsigned", () => {
  const source = readFileSync("lib/alliance/webhookEvidence.ts", "utf8");
  assert.match(source, /ALLIANCE_WEBHOOK_NOT_CONFIGURED/);
  assert.match(source, /status:\s*503/);
  assert.match(source, /INVALID_SIGNATURE/);
  assert.match(source, /status:\s*401/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /alliance_webhook_events/);
});
