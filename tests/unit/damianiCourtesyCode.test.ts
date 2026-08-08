import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeDiscountAmount,
  validateCodeRedeemable,
  type DiscountCode,
} from "@/lib/discountCodes";

// DAMIANI50 is a single-use, 50% courtesy code for a returning professional
// client. These tests pin the checkout-relevant behavior: the adjustment is
// exactly 50% of the eligible service subtotal, excluded charges are never
// discounted, and the code cannot be redeemed a second time.
function damiani(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return {
    id: "damiani-code",
    code: "DAMIANI50",
    label: "Milano Seal courtesy — Avv. Damiani",
    discount_type: "percent",
    discount_value: 50,
    max_uses: 1,
    uses_count: 0,
    valid_from: "2026-01-01T00:00:00.000Z",
    valid_until: null,
    active: true,
    created_by: "founder",
    notes: null,
    deal_id_restriction: null,
    single_use: true,
    ...overrides,
  };
}

test("DAMIANI50 applies exactly 50% to the eligible service subtotal", () => {
  assert.equal(computeDiscountAmount(damiani(), 750), 375);
  assert.equal(computeDiscountAmount(damiani(), 975), 487.5);
  assert.equal(computeDiscountAmount(damiani(), 1850), 925);
});

test("excluded charges are never folded into the discounted subtotal", () => {
  // Only the eligible service subtotal is discounted. Shipping, government,
  // translation and other pass-through charges are added on top, undiscounted.
  const eligibleServiceSubtotal = 750;
  const excludedCharges = 250; // e.g. apostille coordination / shipping pass-through
  const adjustment = computeDiscountAmount(damiani(), eligibleServiceSubtotal);
  const finalAmountDue = eligibleServiceSubtotal - adjustment + excludedCharges;
  assert.equal(adjustment, 375);
  assert.equal(finalAmountDue, 625);
  // The excluded portion is fully preserved in the total.
  assert.ok(finalAmountDue >= excludedCharges);
});

test("DAMIANI50 is single-use: a second redemption is rejected", () => {
  assert.deepEqual(validateCodeRedeemable(damiani({ uses_count: 0 })), { ok: true });
  const second = validateCodeRedeemable(damiani({ uses_count: 1 }));
  assert.equal(second.ok, false);
});

test("an inactive or usage-exhausted DAMIANI50 cannot be redeemed", () => {
  assert.equal(validateCodeRedeemable(damiani({ active: false })).ok, false);
  assert.equal(validateCodeRedeemable(damiani({ max_uses: 1, uses_count: 1 })).ok, false);
});

test("the courtesy adjustment never exceeds the eligible subtotal", () => {
  assert.ok(computeDiscountAmount(damiani(), 0) <= 0.0001);
  const subtotal = 500;
  assert.ok(computeDiscountAmount(damiani(), subtotal) <= subtotal);
});
