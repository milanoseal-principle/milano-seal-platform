import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "../../pricing";
import { generateInvoice } from "../../invoice";
import {
  eligibleSubtotalFromTotal,
  effectiveTotalAfterCourtesy,
  nonDiscountableTotalFromBreakdown,
} from "../courtesyEligibility";

test("Tiffany Italy RON + apostille + international courier certification prices to $387.50 Wise retainer", () => {
  const quote = calculatePrice({
    tier: "priority",
    document_count: 1,
    signer_count: 1,
    notarized_signature_count: 1,
    apostille_count: 1,
    urgency: "standard",
    shipping: "international",
  });

  assert.equal(quote.base, 975);
  assert.equal(
    quote.breakdown.find((item) => item.key === "notarized_signatures")?.amount,
    25,
  );
  assert.equal(
    quote.breakdown.find((item) => item.key === "apostille")?.amount,
    250,
  );
  assert.equal(
    quote.breakdown.find((item) => item.key === "shipping")?.amount,
    150,
  );
  assert.equal(quote.total, 1400);

  const nonDiscountable = nonDiscountableTotalFromBreakdown(quote.breakdown);
  const eligibleSubtotal = eligibleSubtotalFromTotal(quote.total, nonDiscountable);
  assert.equal(nonDiscountable, 150);
  assert.equal(eligibleSubtotal, 1250);

  const tiffTest50Discount = Math.round(eligibleSubtotal * 0.5 * 100) / 100;
  assert.equal(tiffTest50Discount, 625);

  const finalTotal = effectiveTotalAfterCourtesy(quote.total, tiffTest50Discount);
  assert.equal(finalTotal, 775);

  const invoice = generateInvoice(finalTotal);
  assert.equal(invoice.retainer, 387.5);
  assert.equal(invoice.balance, 387.5);
});
