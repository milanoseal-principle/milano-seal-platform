import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretIntakeText } from "../intakeInterpretation";
import { quickTagParse } from "../quickTags";

// ── Polarity model ──────────────────────────────────────────────────────────

test("positive / negative / already-completed polarity for notarization", () => {
  assert.equal(interpretIntakeText("I need a notary").concepts.notarization.polarity, "positive");
  assert.equal(interpretIntakeText("no notarization needed").concepts.notarization.polarity, "negative");
  assert.equal(interpretIntakeText("already notarized").concepts.notarization.polarity, "already_completed");
});

test("punctuation terminates negation scope", () => {
  // "No apostille, notarization required" — apostille negated, notarization NOT negated.
  const r = interpretIntakeText("No apostille, notarization required");
  assert.equal(r.concepts.apostille.polarity, "negative");
  assert.equal(r.concepts.notarization.polarity, "positive");
});

test("coordinated negation applies to RON and translation", () => {
  const r = interpretIntakeText("2 apostille to columbia i do not need ron or translation");
  assert.equal(r.concepts.apostille.polarity, "positive");
  assert.equal(r.concepts.ron.polarity, "negative");
  assert.equal(r.concepts.translation.polarity, "negative");
  assert.equal(r.apostilleQuantity.value, 2);
});

test("coordinated negation reaches legacy intake flags without fabrication", () => {
  const out = quickTagParse("2 apostille to columbia i do not need ron or translation");
  assert.equal(out.apostilleRequired, true);
  assert.equal(out.ronReviewRequired, false);
  assert.equal(out.translationNeeded, false);
});

test("contradictions are recorded, not silently resolved", () => {
  const r = interpretIntakeText("already notarized but need notarization");
  assert.ok(r.contradictions.includes("notarization"));
  assert.equal(r.concepts.notarization.polarity, "unknown");
});

test("apostille quantity is extracted", () => {
  assert.equal(interpretIntakeText("2 apostilles for Italy").apostilleQuantity.value, 2);
});

// ── Integrated behavior through quickTagParse (legacy flags) ─────────────────

test("no-fabrication: apostille never auto-creates notarization/RON", () => {
  const out = quickTagParse("2 apostilles for Italy");
  assert.equal(out.apostilleRequired, true);
  assert.equal(out.ronReviewRequired, false); // no notarization asked
});

// ── The SOP fixture matrix ──────────────────────────────────────────────────

test("fixture 1: 2 apostille Colombia no notarization needed", () => {
  const out = quickTagParse("2 apostille Colombia no notarization needed");
  assert.equal(out.apostilleRequired, true);
  assert.equal(out.ronReviewRequired, false);
  assert.equal(interpretIntakeText("2 apostille Colombia no notarization needed").apostilleQuantity.value, 2);
});

test("fixture 2: POA notarized remotely and apostilled for Italy", () => {
  const out = quickTagParse("I need this power of attorney notarized remotely and apostilled for Italy");
  assert.equal(out.ronReviewRequired, true);
  assert.equal(out.apostilleRequired, true);
});

test("fixture 3: already notarized affidavit, only need Florida apostille", () => {
  const out = quickTagParse("I already notarized the affidavit. I only need the Florida apostille.");
  assert.equal(out.ronReviewRequired, false); // notarization already completed
  assert.equal(out.apostilleRequired, true);
});

test("fixture 4: mobile notary tonight, two signers", () => {
  const r = interpretIntakeText("I need a mobile notary at my house tonight for two signers");
  assert.equal(r.concepts.mobile.polarity, "positive");
  assert.equal(r.concepts.sameDay.polarity, "positive");
  const out = quickTagParse("I need a mobile notary at my house tonight for 2 signers");
  assert.equal(out.ronReviewRequired, true); // notary requested
  assert.equal(out.signerCount, 2);
  assert.notEqual(out.apostilleRequired, true); // not auto-added
});

test("fixture 5: Colorado birth certificate going to Italy — no auto notarization", () => {
  const out = quickTagParse("Colorado birth certificate going to Italy");
  assert.equal(out.ronReviewRequired, false);
  assert.notEqual(out.apostilleRequired, true); // not auto-added without evidence
});

test("fixture 7: 'No apostille, notarization required'", () => {
  const out = quickTagParse("No apostille, notarization required");
  assert.equal(out.apostilleRequired, false);
  assert.equal(out.ronReviewRequired, true);
});

test("fixture 8: apostille yes, notary unsure — RON not auto-true", () => {
  const out = quickTagParse("Need apostille but don't know if I need a notary");
  assert.equal(out.apostilleRequired, true);
  assert.notEqual(out.ronReviewRequired, true); // must NOT be automatically true
});

test("fixture 9: translation + priority reach the flags", () => {
  const out = quickTagParse("Three documents, one signer, translation to Italian, priority");
  assert.equal(out.translationNeeded, true);
  assert.equal(out.urgency, "expedited");
});

// no-fabrication rules
test("negated translation is suppressed", () => {
  const out = quickTagParse("apostille for Germany, doesn't need translation");
  assert.equal(out.apostilleRequired, true);
  assert.equal(out.translationNeeded, false);
});
