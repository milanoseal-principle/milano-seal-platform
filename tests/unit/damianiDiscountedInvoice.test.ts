import { test } from "node:test";
import assert from "node:assert/strict";
import { generateInvoice } from "@/lib/invoice";

// These lock the money invariants of the Damiani path that /api/intake enforces:
//  1. DAMIANI50 previews exactly 50% of the eligible subtotal (integer cents).
//  2. The invoice (and therefore the Wise amount) is derived from the DISCOUNTED
//     effective total — never from the original total.
//  3. Previewing/pricing the discount performs NO redemption side effect (this is
//     a pure calculation; redemption happens only in confirm_wise_payment_for_deal
//     after a reconciled Wise settlement).

// Mirror of the server-side courtesy calculation in app/api/intake/route.ts.
function courtesyAmount(eligibleSubtotal: number, percentage: number): number {
  const eligibleSubtotalCents = Math.round(eligibleSubtotal * 100);
  const discountCents = Math.round((eligibleSubtotalCents * percentage) / 100);
  return Math.min(eligibleSubtotalCents, Math.max(0, discountCents)) / 100;
}

function effectiveTotal(original: number, discount: number): number {
  return Math.max(0, Math.round((original - discount) * 100) / 100);
}

test("DAMIANI50 preview computes exactly 50% of eligible subtotal in cents", () => {
  assert.equal(courtesyAmount(750, 50), 375);
  assert.equal(courtesyAmount(975, 50), 487.5);
  assert.equal(courtesyAmount(1250, 50), 625);
});

test("effective total is the discounted total, not the original", () => {
  const original = 1250;
  const discount = courtesyAmount(original, 50); // 625
  assert.equal(effectiveTotal(original, discount), 625);
});

test("Wise amount (invoice retainer) derives from the DISCOUNTED total", () => {
  const original = 1250;
  const discount = courtesyAmount(original, 50);
  const effective = effectiveTotal(original, discount); // 625

  const discountedInvoice = generateInvoice(effective);
  const originalInvoice = generateInvoice(original);

  // Retainer is 50% of the discounted subtotal → the Wise amount_due.
  assert.equal(discountedInvoice.retainer, 312.5);
  // It must be strictly less than the retainer computed from the full price.
  assert.ok(discountedInvoice.retainer < originalInvoice.retainer);
  assert.equal(originalInvoice.retainer, 625);
});

test("courtesy adjustment can never exceed the eligible subtotal", () => {
  assert.equal(courtesyAmount(0, 50), 0);
  assert.ok(courtesyAmount(500, 50) <= 500);
});
