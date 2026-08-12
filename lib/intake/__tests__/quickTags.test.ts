import { test } from "node:test";
import assert from "node:assert/strict";
import { quickTagParse } from "../quickTags";

// The reported bug: "no notarization needed" must NOT flag RON review.
test("negated notarization does not require RON review", () => {
  for (const text of [
    "2 apostille Columbia no notarization needed",
    "no notarization needed",
    "without notarization",
    "no notary required",
    "notarization not needed",
    "notarization not required",
    "does not need notarization",
    "don't need a notary",
  ]) {
    const out = quickTagParse(text);
    assert.equal(out.ronReviewRequired, false, `should be false for: "${text}"`);
  }
});

// Positive cases: a real notarization/RON request still flags RON review.
test("real notarization / RON request flags RON review", () => {
  for (const text of [
    "power of attorney notarization for Italy",
    "I need a notary",
    "remote online notarization",
    "ron for two signers",
  ]) {
    const out = quickTagParse(text);
    assert.equal(out.ronReviewRequired, true, `should be true for: "${text}"`);
  }
});

// Negation must not bleed across punctuation to an unrelated notarization ask.
test("negation before an unrelated clause does not suppress a real notarization need", () => {
  const out = quickTagParse("no apostille, notarization needed");
  assert.equal(out.ronReviewRequired, true);
});

// Apostille detection is unaffected by the RON change.
test("apostille still detected alongside a notarization negation", () => {
  const out = quickTagParse("2 apostille Columbia no notarization needed");
  assert.equal(out.apostilleRequired, true);
  assert.equal(out.ronReviewRequired, false);
});
