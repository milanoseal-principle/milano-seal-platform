import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = [
  "app/api/dispatch/jobs/route.ts",
  "app/api/dispatch/request/route.ts",
  "app/api/dispatch/reassign/route.ts",
  "app/api/dispatch/escalate/route.ts",
  "app/api/dispatch/jobs/[id]/route.ts",
  "app/api/webhooks/alliance/job/route.ts",
  "app/api/webhooks/alliance/toolbelt/route.ts",
  "app/api/webhooks/alliance/credential/route.ts",
];

for (const file of files) {
  test(`${file} does not fabricate operational success`, () => {
    const source = readFileSync(file, "utf8");
    assert.match(source, /status:\s*503/);
    assert.doesNotMatch(source, /disp_stub_/);
    assert.doesNotMatch(source, /reassignment_queued/);
    assert.doesNotMatch(source, /status:\s*["']queued["']/);
    assert.doesNotMatch(source, /status:\s*["']escalated["']/);
    assert.doesNotMatch(source, /current_assignment_state:\s*["']UNASSIGNED_STAGED["']/);
    assert.doesNotMatch(source, /console\.log\(/);
  });
}
