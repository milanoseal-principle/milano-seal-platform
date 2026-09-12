import assert from "node:assert/strict";
import test from "node:test";
import { calculatePrice } from "@/lib/pricing";
import { calculateMilanoPricing } from "@/src/features/pricing/pricingEngine";

test("Signature Matter includes first apostille coordination in $750 base", () => {
  const quote = calculatePrice({
    tier: "signature",
    document_count: 1,
    apostille_count: 1,
    notarized_signature_count: 1,
  });

  assert.equal(quote.base, 750);
  assert.equal(quote.total, 750);
  assert.equal(quote.internal.apostille_count, 1);
  assert.equal(quote.internal.apostille_total, 0);
  assert.equal(quote.breakdown.some((item) => item.key === "additional_apostille_documents"), false);
});

test("six already-certified vital records use Authentication base plus five additional apostilled documents", () => {
  const quote = calculatePrice({
    tier: "signature",
    document_count: 6,
    apostille_count: 6,
    notarized_signature_count: 0,
  });

  assert.equal(quote.base, 599);
  assert.equal(quote.total, 1849);
  assert.equal(quote.internal.additional_documents, 5);
  assert.equal(quote.internal.apostille_total, 1250);
  assert.deepEqual(
    quote.breakdown.find((item) => item.key === "additional_apostilled_documents")?.amount,
    1250,
  );
});

test("additional apostille documents are not double charged as generic documents", () => {
  const quote = calculatePrice({
    tier: "signature",
    document_count: 4,
    apostille_count: 3,
    notarized_signature_count: 0,
  });

  assert.equal(quote.total, 1174);
  assert.equal(quote.internal.apostille_total, 500);
  assert.equal(quote.internal.additional_documents, 3);
  assert.equal(
    quote.breakdown.find((item) => item.key === "additional_non_apostille_documents")?.amount,
    75,
  );
});

test("50/50 Signature Matter pricing preserves deposit and final-balance gates", () => {
  const quote = calculateMilanoPricing({
    lane: "signature",
    documentCount: 6,
    apostilleRequired: true,
    apostilleCount: 6,
    signerCount: 1,
    paymentMode: "split_50_50",
    matterReference: "MS-TEST-001",
  });

  assert.equal(quote.final_total, 2000);
  assert.equal(quote.deposit_amount, 1000);
  assert.equal(quote.balance_due, 1000);
  assert.equal(quote.pricing_truth.first_apostille_coordination_included, true);
  assert.equal(quote.pricing_truth.additional_apostille_documents, 5);
  assert.equal(quote.payment_reference, "MS-TEST-001-DEPOSIT");
});
