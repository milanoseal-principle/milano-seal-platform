import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeDiscountAmount,
  validateCodeRedeemable,
  type DiscountCode,
} from "@/lib/discountCodes";

function damiani(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return {
    id: "damiani-code",
    code: "DAMIANI50",
    discount_type: "percentage",
    discount_value: 50,
    status: "active",
    usage_limit: 1,
    usage_count: 0,
    starts_at: "2026-01-01T00:00:00.000Z",
    expires_at: null,
    applies_to: "eligible_subtotal",
    matter_id: null,
    client_id: null,
    client_label: "Milano Seal courtesy — Avv. Damiani",
    internal_reason: null,
    created_by: "founder",
    updated_by: null,
    metadata: {},
    ...overrides,
  };
}

test("DAMIANI50 applies exactly 50% to eligible service subtotal", () => {
  assert.equal(computeDiscountAmount(damiani(), 750), 375);
  assert.equal(computeDiscountAmount(damiani(), 975), 487.5);
  assert.equal(computeDiscountAmount(damiani(), 1850), 925);
});

test("excluded charges remain outside the discounted subtotal", () => {
  const eligibleServiceSubtotal = 750;
  const excludedCharges = 250;
  const adjustment = computeDiscountAmount(damiani(), eligibleServiceSubtotal);
  const finalAmountDue = eligibleServiceSubtotal - adjustment + excludedCharges;
  assert.equal(adjustment, 375);
  assert.equal(finalAmountDue, 625);
});

test("DAMIANI50 is single-use through usage_limit", () => {
  assert.deepEqual(validateCodeRedeemable(damiani({ usage_count: 0 })), { ok: true });
  assert.equal(validateCodeRedeemable(damiani({ usage_count: 1 })).ok, false);
});

test("inactive, exhausted, expired, and future codes are rejected", () => {
  const now = new Date("2026-08-08T12:00:00.000Z");
  assert.equal(validateCodeRedeemable(damiani({ status: "inactive" }), undefined, now).ok, false);
  assert.equal(validateCodeRedeemable(damiani({ status: "exhausted" }), undefined, now).ok, false);
  assert.equal(validateCodeRedeemable(damiani({ expires_at: "2026-08-07T00:00:00.000Z" }), undefined, now).ok, false);
  assert.equal(validateCodeRedeemable(damiani({ starts_at: "2026-08-09T00:00:00.000Z" }), undefined, now).ok, false);
});

test("matter-restricted code cannot be used on a different matter", () => {
  assert.equal(
    validateCodeRedeemable(damiani({ matter_id: "matter-a" }), "matter-b").ok,
    false,
  );
});

test("courtesy adjustment never exceeds eligible subtotal", () => {
  assert.equal(computeDiscountAmount(damiani(), 0), 0);
  const subtotal = 500;
  assert.ok(computeDiscountAmount(damiani(), subtotal) <= subtotal);
});
