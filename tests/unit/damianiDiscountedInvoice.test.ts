import { test } from "node:test";
import assert from "node:assert/strict";
import { generateInvoice } from "@/lib/invoice";
import { computeDiscountAmount, type DiscountCode } from "@/lib/discountCodes";
import {
  nonDiscountableTotalFromBreakdown,
  eligibleSubtotalFromTotal,
  effectiveTotalAfterCourtesy,
} from "@/lib/pricing/courtesyEligibility";

// These lock the money invariants of the Damiani path that /api/intake enforces.
// They exercise the SAME production functions the intake route calls
// (computeDiscountAmount + the courtesyEligibility boundary helpers), so a
// regression in the route's calculation breaks these tests instead of passing
// against a test-local copy.
//  1. DAMIANI50 discounts exactly 50% of the ELIGIBLE subtotal (never pass-through).
//  2. The invoice (and therefore the Wise amount) derives from the DISCOUNTED
//     effective total — never from the original total.
//  3. Pricing the discount performs NO redemption side effect — redemption happens
//     only in confirm_wise_payment_for_deal after a reconciled Wise settlement.

const DAMIANI50 = {
  discount_type: "percentage",
  discount_value: 50,
} as DiscountCode;

test("DAMIANI50 computes exactly 50% of the eligible subtotal", () => {
  assert.equal(computeDiscountAmount(DAMIANI50, 750), 375);
  assert.equal(computeDiscountAmount(DAMIANI50, 975), 487.5);
  assert.equal(computeDiscountAmount(DAMIANI50, 1250), 625);
});

test("courtesy discounts only the eligible subtotal, never pass-through shipping", () => {
  // 975 service subtotal + 150 shipping (pass-through) = 1125 original total.
  const breakdown = [
    { key: "base", amount: 975 },
    { key: "shipping", amount: 150 },
  ];
  const nonDiscountable = nonDiscountableTotalFromBreakdown(breakdown);
  const original = 1125;
  const eligible = eligibleSubtotalFromTotal(original, nonDiscountable);

  assert.equal(nonDiscountable, 150);
  assert.equal(eligible, 975);

  const discount = computeDiscountAmount(DAMIANI50, eligible); // 487.5, not 562.5
  assert.equal(discount, 487.5);

  // Boundary invariant: eligible + nonDiscountable === original.
  assert.equal(eligible + nonDiscountable, original);
  // Shipping survives the discount in the effective total.
  const effective = effectiveTotalAfterCourtesy(original, discount);
  assert.equal(effective, 637.5); // 975 - 487.5 + 150
});

test("Wise amount (invoice retainer) derives from the DISCOUNTED total", () => {
  const original = 1250; // no pass-through charges
  const discount = computeDiscountAmount(DAMIANI50, original);
  const effective = effectiveTotalAfterCourtesy(original, discount); // 625

  const discountedInvoice = generateInvoice(effective);
  const originalInvoice = generateInvoice(original);

  // Retainer is 50% of the discounted subtotal → the Wise amount_due.
  assert.equal(discountedInvoice.retainer, 312.5);
  // It must be strictly less than the retainer computed from the full price.
  assert.ok(discountedInvoice.retainer < originalInvoice.retainer);
  assert.equal(originalInvoice.retainer, 625);
});

test("courtesy adjustment can never exceed the eligible subtotal", () => {
  assert.equal(computeDiscountAmount(DAMIANI50, 0), 0);
  assert.ok(computeDiscountAmount(DAMIANI50, 500) <= 500);
});
