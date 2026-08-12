// Canonical eligible-subtotal boundary for courtesy codes.
//
// A courtesy code (e.g. DAMIANI50) may only discount the eligible SERVICE
// subtotal. Pass-through / dispatch charges (shipping, courier) are never
// discountable. This module is the single source of that boundary so the intake
// route and its tests compute it identically — the money math is never a
// test-local copy.
//
// Invariant preserved by these helpers:
//   eligibleSubtotal + nonDiscountableTotal === originalTotal
//   finalTotal === eligibleSubtotal - discountAmount + nonDiscountableTotal
//                === originalTotal - discountAmount   (discount ≤ eligible)

export interface PricingBreakdownItem {
  key: string;
  amount: number;
}

// Pass-through cost categories that a courtesy code must never reduce.
export const NON_DISCOUNTABLE_KEYS = new Set(["shipping", "courier"]);

function cents(value: number): number {
  return Math.round(Number(value ?? 0) * 100);
}

function money(valueCents: number): number {
  return Math.max(0, valueCents) / 100;
}

/** Sum of pass-through (non-discountable) charges within a pricing breakdown. */
export function nonDiscountableTotalFromBreakdown(
  breakdown: readonly PricingBreakdownItem[],
): number {
  const total = breakdown
    .filter((item) => NON_DISCOUNTABLE_KEYS.has(item.key))
    .reduce((sum, item) => sum + cents(item.amount), 0);
  return money(total);
}

/** Eligible service subtotal = original total minus non-discountable charges. */
export function eligibleSubtotalFromTotal(
  originalTotal: number,
  nonDiscountableTotal: number,
): number {
  return money(cents(originalTotal) - cents(nonDiscountableTotal));
}

/** Effective total after applying a (already eligible-capped) courtesy amount. */
export function effectiveTotalAfterCourtesy(
  originalTotal: number,
  discountAmount: number,
): number {
  return money(cents(originalTotal) - cents(discountAmount));
}
