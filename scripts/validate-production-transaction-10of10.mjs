import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const scheduling = read("lib/scheduling/complimentarySchedulingGate.ts");
const ronGuard = read("lib/bluenotary/guards.ts");
const ronProjection = read("lib/bluenotary/projection.ts");
const ronReturn = read("app/portal/ron/complete/page.tsx");
const ronSessions = read("app/api/dashboard/ron/sessions/route.ts");
const blueNotaryWebhook = read("app/api/webhooks/bluenotary/route.ts");
const release = read("lib/release/performFinalRelease.ts");
const genericDeal = read("app/api/deals/[id]/route.ts");
const portalRON = read("app/portal/ron/page.tsx");

assert.doesNotMatch(scheduling, /wise_submission_observed/);
assert.match(scheduling, /hasExactVerifiedSettlement/);
assert.match(scheduling, /Scheduling unlocks only after exact verified Wise settlement/);
assert.match(scheduling, /snapshotAmount != null/);
assert.match(scheduling, /evaluateExecutionGate/);
assert.match(ronGuard, /evaluateSchedulingGate/);
assert.match(ronGuard, /NOTARIAL_ACT_REVIEW_REQUIRED/);
assert.doesNotMatch(ronGuard, /is_platform_fee_only'/);
assert.match(ronProjection, /schedulingAuthorized/);
assert.doesNotMatch(ronProjection, /payment_confirmed:/);
assert.match(ronProjection, /signing_url_released === true/);
assert.match(ronSessions, /duplicate: true/);
for (const terminal of ["RON_EXPIRED", "RON_COMPLETED", "SIGNED_DOCS_RETRIEVED", "READY_FOR_APOSTILLE"]) {
  assert.match(ronSessions, new RegExp(terminal));
}
assert.match(blueNotaryWebhook, /eventHash/);
assert.match(blueNotaryWebhook, /BLUENOTARY_WEBHOOK_SECRET/);
assert.doesNotMatch(blueNotaryWebhook, /apostille_status|release_status/);
assert.match(ronReturn, /browser return does not establish completion/i);
assert.doesNotMatch(ronReturn, /\.update\(|\.insert\(/);
assert.match(release, /payment|settlement/i);
assert.match(release, /custody/i);
assert.doesNotMatch(genericDeal, /payment_confirmed\s*:\s*true/);
assert.doesNotMatch(portalRON, /Choose Jurat|Choose Acknowledgment|Pay Again/i);

const activePaymentSources = [
  read("lib/payments/paymentGate.ts"),
  scheduling,
  read("app/api/webhooks/wise/route.ts"),
].join("\n");
assert.doesNotMatch(activePaymentSources, /stripe/i);

console.log("PASS source-level production transaction invariants");
console.log("LIVE PRODUCTION TRANSACTION CERTIFICATION remains a separate required gate");
