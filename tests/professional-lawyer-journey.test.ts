import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("homepage routes new attorneys into counsel acquisition", () => {
  const persona = read("components/landing/persona-routing.tsx");
  const publicCta = read("components/conversion/MilanoPublicCtaModule.tsx");

  assert.match(persona, /href: "\/counsel"/);
  assert.doesNotMatch(persona, /href: "\/lawyer-access"/);
  assert.match(persona, /International Counsel Execution Lane/);
  assert.match(publicCta, /For International Counsel/);
  assert.match(publicCta, /href: "\/counsel"/);
});

test("lawyer-access is an optional intelligence layer, not a competing execution funnel", () => {
  const counsel = read("app/lawyer-access/page.tsx");
  assert.match(counsel, /not a second Matter-entry workflow/);
  assert.match(counsel, /Send a U.S. Matter/);
  assert.match(counsel, /href="\/counsel"/);
});

test("professional route facts carry into secure intake", () => {
  const intake = read("app/intake/page.tsx");
  for (const token of ["document_type", "origin", "signer_posture", "receiving_authority", "Professional pre-flight carried forward"]) {
    assert.ok(intake.includes(token), `missing professional intake carry-forward token: ${token}`);
  }
});

test("public payment UX matches the governed 50/50 Matter gates", () => {
  const portal = read("app/portal/invoice/page.tsx");
  const pricing = read("app/pricing/page.tsx");
  const revenue = read("data/milano-revenue-copy-system.ts");
  const machine = read("data/matter-state-machine.ts");
  const matterService = read("src/features/matters/matterService.ts");

  assert.match(portal, /Scheduling stays locked until verified Wise settlement/);
  assert.match(pricing, /50% Wise deposit unlocks scheduling and eligible RON\/execution/);
  assert.match(pricing, /final 50% must be verified before the completed document packet is released for international shipping/);
  assert.match(revenue, /verified 50% Wise deposit unlocks scheduling and eligible RON\/execution/);
  assert.match(revenue, /final 50% must be verified before controlled international release and shipping/);

  const apostille = machine.indexOf('"apostille_received"');
  const finalDue = machine.indexOf('"final_balance_due"');
  const finalConfirmed = machine.indexOf('"final_payment_confirmed"');
  const release = machine.indexOf('"ready_for_release"');
  const label = machine.indexOf('"label_created"');
  assert.ok(apostille >= 0 && apostille < finalDue);
  assert.ok(finalDue < finalConfirmed);
  assert.ok(finalConfirmed < release);
  assert.ok(release < label);
  assert.match(matterService, /paymentMode: "split_50_50"/);
});
