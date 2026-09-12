import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DOCUMENT_FEES,
  MATTER_BASES,
  MOBILE_TRAVEL_FEES,
  NOTARY_SIGNER_FEES,
  TIMING_FEES,
} from "@/lib/pricing/pricingCatalog";
import { composeCanonicalPrivateQuote } from "@/lib/pricing/pricingComposer";

test("authentication Matter starts at 599 with first document and first apostille coordination included", () => {
  const q = composeCanonicalPrivateQuote({
    matterBase: "authentication",
    documentCount: 1,
    apostilleCount: 1,
  });
  assert.equal(q.total, 599);
  assert.equal(q.lineItems.length, 1);
  assert.equal(q.depositAmount, 299.5);
  assert.equal(q.balanceDue, 299.5);
});

test("signature Matter supports either RON or in-person without stacking another Matter base", () => {
  const ron = composeCanonicalPrivateQuote({
    matterBase: "signature",
    executionMethod: "ron",
    documentCount: 1,
    apostilleCount: 1,
  });
  const inPerson = composeCanonicalPrivateQuote({
    matterBase: "signature",
    executionMethod: "in_person",
    mobileMiles: 0,
    documentCount: 1,
    apostilleCount: 1,
  });
  assert.equal(ron.total, 750);
  assert.equal(inPerson.total, 750);
});

test("six-document apostille packet prices without generic document double charge", () => {
  const q = composeCanonicalPrivateQuote({
    matterBase: "signature",
    documentCount: 6,
    apostilleCount: 6,
  });
  assert.equal(q.total, 2000);
  assert.equal(
    q.lineItems.find((x) => x.code === "additional_apostilled_documents")?.amount,
    5 * DOCUMENT_FEES.additional_apostilled_document,
  );
  assert.equal(
    q.lineItems.some((x) => x.code === "additional_non_apostille_documents"),
    false,
  );
});

test("Florida in-person Matter itemizes notarial acts, travel and rush", () => {
  const q = composeCanonicalPrivateQuote({
    matterBase: "signature",
    executionMethod: "in_person",
    floridaNotarialActCount: 1,
    mobileMiles: 20,
    timing: ["rush_same_day"],
    documentCount: 1,
    apostilleCount: 1,
  });
  assert.equal(
    q.total,
    MATTER_BASES.signature.amount +
      NOTARY_SIGNER_FEES.florida_notarial_act +
      MOBILE_TRAVEL_FEES.tier_11_25 +
      TIMING_FEES.rush_same_day,
  );
  assert.equal(q.total, 1235);
});

test("over-50-mile mobile work requires quote review instead of invented travel fee", () => {
  const q = composeCanonicalPrivateQuote({
    matterBase: "signature",
    executionMethod: "in_person",
    mobileMiles: 75,
  });
  assert.equal(q.reviewRequired, true);
  assert.ok(q.reviewOnlyItems.includes("mobile_travel_over_50_miles"));
});

test("international passport document review / execution coordination Matter remains 350", () => {
  const q = composeCanonicalPrivateQuote({
    matterBase: "international_passport_execution",
    executionMethod: "in_person",
    floridaNotarialActCount: 0,
    apostilleCount: 0,
  });
  assert.equal(q.total, 350);
  assert.equal(
    MATTER_BASES.international_passport_execution.label,
    "International Passport Document Review / Execution Coordination",
  );
});

test("quote-review-only consular work never receives an invented fixed fee", () => {
  const q = composeCanonicalPrivateQuote({
    matterBase: "executive",
    reviewOnlyItems: ["consular_legalization"],
  });
  assert.equal(q.reviewRequired, true);
  assert.ok(q.reviewOnlyItems.includes("consular_legalization"));
});
