import { test } from "node:test";
import assert from "node:assert/strict";
import { projectCanonicalQuote } from "@/lib/pricing/canonicalQuoteOrchestrator";

test("already-issued apostille Matter selects Authentication base", () => {
  const q = projectCanonicalQuote({
    execution_method: "none",
    notarization_required: false,
    document_count: 1,
    apostille_required: true,
  });
  assert.equal(q.matterBase, "authentication");
  assert.equal(q.quote.total, 599);
  assert.equal(q.quote.depositAmount, 299.5);
  assert.equal(q.quote.balanceDue, 299.5);
});

test("RON signature Matter uses the Signature base and included first apostille", () => {
  const q = projectCanonicalQuote({
    execution_method: "ron",
    notarization_required: true,
    document_count: 1,
    apostille_required: true,
  });
  assert.equal(q.matterBase, "signature");
  assert.equal(q.quote.total, 750);
  assert.equal(q.quote.lineItems.length, 1);
});

test("Florida mobile quote itemizes statutory act, travel and same-day handling", () => {
  const q = projectCanonicalQuote({
    execution_method: "mobile",
    notarization_required: true,
    document_count: 1,
    apostille_required: true,
    florida_notarial_act_count: 1,
    miles: 20,
    urgency: "same_day",
  });
  assert.equal(q.executionMethod, "in_person");
  assert.equal(q.quote.total, 1235);
});

test("passport review execution is country-neutral", () => {
  const q = projectCanonicalQuote({
    service_code: "international_passport_execution",
    execution_method: "in_person",
  });
  assert.equal(q.matterBase, "international_passport_execution");
  assert.equal(q.quote.total, 350);
});

test("pass-through courier and authority charges remain outside eligible discount subtotal", () => {
  const q = projectCanonicalQuote({
    matter_base: "signature",
    execution_method: "ron",
    courier_cost: 80,
    external_authority_fees: 25,
  });
  assert.equal(q.nonDiscountableTotal, 105);
  assert.equal(q.eligibleSubtotal, q.quote.subtotal - 105);
});

test("governed exceptions block automatic quote approval", () => {
  const q = projectCanonicalQuote({
    matter_base: "executive",
    execution_method: "in_person",
    consular_legalization: true,
  });
  assert.equal(q.reviewRequired, true);
  assert.ok(q.reviewReasons.includes("consular_legalization"));
});
