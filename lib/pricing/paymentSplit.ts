/**
 * The one canonical 50/50 payment split (engagement retainer before execution
 * scheduling; final balance after apostille completion and before
 * international release).
 *
 * Integer cents only: dividing a dollar amount and rounding afterwards loses
 * the half-cent to binary floating point (1.15 / 2 = 0.57499…), which made the
 * payable retainer one cent lower than the half-up rule for ~3% of totals.
 *
 *   RETAINER_CENTS      = ceil(TOTAL_CENTS / 2)
 *   FINAL_BALANCE_CENTS = TOTAL_CENTS - RETAINER_CENTS
 *
 * so the two stages always reconcile exactly to the total.
 */
export interface PaymentSplit {
  total: number;
  retainer: number;
  finalBalance: number;
}

export function toCents(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("PAYMENT_SPLIT_INVALID_AMOUNT");
  return Math.round(amount * 100);
}

export function splitFiftyFiftyCents(totalCents: number): { retainerCents: number; finalBalanceCents: number } {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) throw new RangeError("PAYMENT_SPLIT_INVALID_CENTS");
  const retainerCents = Math.ceil(totalCents / 2);
  return { retainerCents, finalBalanceCents: totalCents - retainerCents };
}

/** Dollars in, dollars out; the arithmetic is done in integer cents. */
export function splitFiftyFifty(total: number): PaymentSplit {
  const totalCents = toCents(total);
  const { retainerCents, finalBalanceCents } = splitFiftyFiftyCents(totalCents);
  return { total: totalCents / 100, retainer: retainerCents / 100, finalBalance: finalBalanceCents / 100 };
}
