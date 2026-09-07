import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const portal = read("app/portal/ron/page.tsx");
const returned = read("app/portal/ron/complete/page.tsx");
const card = read("components/ron/PortalRONStatusCard.tsx");
const sessions = read("app/api/dashboard/ron/sessions/route.ts");
const guards = read("lib/bluenotary/guards.ts");

test("portal RON consumes canonical scheduling and keeps Wise settlement separate", () => {
  assert.match(portal, /evaluateSchedulingGate/);
  assert.match(card, /Payment submission recorded/);
  assert.match(card, /Wise settlement verification continues automatically/);
  assert.match(card, /No additional payment is required/);
  assert.doesNotMatch(portal + card, /Pay Again|Payment Required/i);
});

test("client never chooses or guesses the notarial act", () => {
  assert.match(portal, /truth\.notarial_act === "review_required"/);
  assert.match(portal, /Awaiting Milano Review/);
  assert.doesNotMatch(portal + card, /Choose Jurat|Choose Acknowledgment/);
});

test("BlueNotary creation stays canonical and idempotent", () => {
  assert.match(sessions, /assertCanCreateRONSession/);
  assert.match(sessions, /duplicate: true/);
  assert.match(guards, /verifySchedulingAuthorized/);
  assert.doesNotMatch(guards, /\.select\([^)]*is_platform_fee_only/);
});

test("browser return cannot fabricate provider completion or downstream authority", () => {
  assert.match(returned, /browser return does not establish completion/i);
  assert.match(returned, /VERIFIED\.has\(session\.milano_ron_status\)/);
  assert.doesNotMatch(returned, /\.update\(|\.insert\(|apostille_status|release_status/);
});

test("portal journey is mobile and reduced-motion safe", () => {
  const progress = read("components/portal/ClientProgressSpine.tsx");
  assert.match(portal, /100svh/);
  assert.match(portal, /safe-area-inset-bottom/);
  assert.match(progress, /aria-current/);
  assert.match(card, /motion-reduce:transition-none/);
});
