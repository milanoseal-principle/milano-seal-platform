import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ritual = fs.readFileSync("components/payments/WisePaymentRitual.tsx", "utf8");
const portalShell = fs.readFileSync("components/portal/portal-shell.tsx", "utf8");

test("client portal uses one Milano-branded Wise payment transition ritual", () => {
  assert.match(portalShell, /WisePaymentRitual/);
  assert.match(portalShell, /matterReference=/);
  assert.match(portalShell, /amountDue=/);
});

test("Wise ritual explicitly explains the external payment handoff without creating fear", () => {
  assert.match(ritual, /Secure Payment Transition/);
  assert.match(ritual, /Continuing to Wise Business/);
  assert.match(ritual, /leaving The Milano Seal™ briefly/);
  assert.match(ritual, /authorized payment rail for this Matter/);
  assert.match(ritual, /The Milano Seal™ remains the system of record/);
  assert.match(ritual, /Matter context remains preserved/);
});

test("Wise ritual intercepts Wise links and preserves explicit user control", () => {
  assert.match(ritual, /host === "wise\.com"/);
  assert.match(ritual, /host\.endsWith\("\.wise\.com"\)/);
  assert.match(ritual, /event\.preventDefault\(\)/);
  assert.match(ritual, /Continue securely to Wise/);
  assert.match(ritual, /Stay on The Milano Seal/);
  assert.match(ritual, /target="_blank"/);
  assert.match(ritual, /data-wise-ritual-bypass="true"/);
});

test("Wise ritual is keyboard dismissible, modal-accessible, and rendered above portal stacking contexts", () => {
  assert.match(ritual, /aria-modal="true"/);
  assert.match(ritual, /event\.key === "Escape"/);
  assert.match(ritual, /continueRef\.current\?\.focus/);
  assert.match(ritual, /createPortal/);
  assert.match(ritual, /document\.body/);
});
