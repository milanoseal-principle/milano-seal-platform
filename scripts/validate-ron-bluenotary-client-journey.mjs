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
assert.match(portal, /Milano review required/);
assert.doesNotMatch(portal + card, /Choose Jurat|Choose Acknowledgment|Pay Again/i);
assert.match(card, /Wise settlement verification continues automatically/);
assert.match(card, /Enter Secure Signing Room/);
assert.match(projection, /signing_url_released === true/);
assert.match(guard, /verifySchedulingAuthorized/);
assert.doesNotMatch(guard, /is_platform_fee_only'/, "RON reads must not query the removed schema column");
assert.match(sessions, /duplicate: true/);
assert.match(sessions, /assertCanCreateRONSession/);
assert.match(returned, /browser return does not establish completion/i);
assert.match(returned, /VERIFIED\.has\(session\.milano_ron_status\)/);
assert.match(webhook, /verifyBNWebhookAuth|BLUENOTARY_WEBHOOK_SECRET/);
assert.match(webhook, /event_hash/);
assert.doesNotMatch(webhook, /apostille_status|release_status/);
assert.match(progress, /aria-current/);
assert.match(progress, /md:hidden/);
assert.match(progress, /bg-\[#C6A65B\]/);
assert.doesNotMatch(portal + card + returned, /stripe/i);

console.log("PASS RON / BlueNotary client journey governance");
