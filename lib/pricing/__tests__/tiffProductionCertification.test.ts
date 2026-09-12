import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "../../pricing";
import { generateInvoice } from "../../invoice";
import { computeDiscountAmount, type DiscountCode } from "../../discountCodes";

test("Tiffany Gate 37 Italy Matter includes first apostille in lane base", () => {
  const quote = calculatePrice({
    tier: "priority",
    document_count: 1,
    signer_count: 1,
    notarized_signature_count: 0,
    apostille_count: 1,
    urgency: "standard",
    shipping: "international",
  });

  assert.equal(quote.base, 975);
  assert.equal(quote.breakdown.some((item) => item.key === "additional_apostille_documents"), false);
  assert.equal(quote.breakdown.find((item) => item.key === "shipping")?.amount, 150);
  assert.equal(quote.total, 1125);
});

test("TIFFTEST99 discounts 99% of the full $1,125 Matter and preserves 50/50 invoice math", () => {
  const code: DiscountCode = {
    id: "tiff-test",
    code: "TIFFTEST99",
    discount_type: "percentage",
    discount_value: 99,
    status: "active",
    usage_limit: 1,
    usage_count: 0,
    starts_at: null,
    expires_at: null,
    applies_to: "matter_total",
  };

  const discountAmount = computeDiscountAmount(code, 1125);
  assert.equal(discountAmount, 1113.75);

  const finalTotal = Math.round((1125 - discountAmount) * 100) / 100;
  assert.equal(finalTotal, 11.25);

  const invoice = generateInvoice(finalTotal);
  assert.equal(invoice.retainer, 5.63);
  assert.equal(invoice.balance, 5.62);
});

test("99% test discount changes money math only; invoice remains awaiting payment", () => {
  const invoice = generateInvoice(11.25);
  assert.equal(invoice.status, "awaiting_payment");
  assert.equal(invoice.payment_options.primary, "wise");
});
