import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "../../pricing";
import { generateInvoice } from "../../invoice";
import { computeDiscountAmount, type DiscountCode } from "../../discountCodes";

test("Tiffany Gate 37 persisted Italy Matter prices to $1,375 before test discount", () => {
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
  assert.equal(quote.breakdown.find((item) => item.key === "apostille")?.amount, 250);
  assert.equal(quote.breakdown.find((item) => item.key === "shipping")?.amount, 150);
  assert.equal(quote.total, 1375);
});

test("TIFFTEST99 discounts 99% of the full $1,375 Matter and leaves a $6.88 Wise retainer", () => {
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

  // applyDiscountToMatter selects original_total as the base for matter_total.
  const discountAmount = computeDiscountAmount(code, 1375);
  assert.equal(discountAmount, 1361.25);

  const finalTotal = Math.round((1375 - discountAmount) * 100) / 100;
  assert.equal(finalTotal, 13.75);

  const invoice = generateInvoice(finalTotal);
  assert.equal(invoice.retainer, 6.88);
  assert.equal(invoice.balance, 6.87);
});

test("99% test discount changes money math only; invoice remains awaiting payment", () => {
  const invoice = generateInvoice(13.75);
  assert.equal(invoice.status, "awaiting_payment");
  assert.equal(invoice.payment_options.primary, "wise");
});
