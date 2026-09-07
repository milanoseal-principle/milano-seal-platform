import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const portal = read("app/portal/ron/page.tsx");
const returned = read("app/portal/ron/complete/page.tsx");
const card = read("components/ron/PortalRONStatusCard.tsx");
const projection = read("lib/bluenotary/projection.ts");
const guard = read("lib/bluenotary/guards.ts");
const sessions = read("app/api/dashboard/ron/sessions/route.ts");
const webhook = read("app/api/webhooks/bluenotary/route.ts");
const progress = read("components/portal/ClientProgressSpine.tsx");

assert.match(portal, /evaluateSchedulingGate/, "portal must consume canonical scheduling authority");
assert.match(portal, /normalizeExecutionTruth/);
assert.match(portal, /Milano review required/);
assert.doesNotMatch(portal + card, /Choose Jurat|Choose Acknowledgment|Pay Again/i);
assert.match(card, /Wise settlement verification continues automatically and separately/);
assert.match(card, /Enter Secure Signing Room/);
assert.match(card, /scheduling_authorized/);
assert.match(projection, /const schedulingAuthorized = ronSession\.payment_gate_status === 'UNLOCKED'/);
assert.doesNotMatch(projection, /const paymentConfirmed = ronSession\.payment_gate_status/,
  "session gate authority must not be named as verified settlement");
assert.match(projection, /signing_url_released === true/);
assert.match(guard, /verifySchedulingAuthorized/);
assert.doesNotMatch(guard, /\.select\([^)]*is_platform_fee_only/,
  "RON guards must not query the removed production column");
assert.match(sessions, /duplicate: true/);
assert.match(sessions, /TERMINAL_SESSION_STATUSES/);
assert.match(sessions, /assertCanCreateRONSession/);
assert.match(returned, /browser return does not establish completion/i);
assert.match(returned, /VERIFIED_PROVIDER_STATUSES\.has\(session\.milano_ron_status\)/);
assert.match(webhook, /verifyBNWebhookAuth|BLUENOTARY_WEBHOOK_SECRET/);
assert.doesNotMatch(webhook, /apostille_status|release_status/);
assert.match(progress, /aria-current/);
assert.match(progress, /md:hidden/);
assert.match(progress, /bg-\[#C6A65B\]/);
assert.doesNotMatch(portal + card + returned + projection + guard, /stripe/i);

console.log("PASS governed RON / BlueNotary client journey");
