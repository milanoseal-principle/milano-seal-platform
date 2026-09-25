// Canonical quote-mutation lock. Once any payment activity exists on a Matter
// the quote is frozen: the Quote Builder renders read-only and the server-side
// commit refuses to write pricing.

export const QUOTE_LOCKING_PAYMENT_STATUSES = [
  "pending",
  "observed_pending",
  "processing",
  "paid",
  "refunded",
] as const;

export interface QuoteLockMatterFacts {
  payment_status?: unknown;
  amount_paid?: unknown;
  payment_observed_at?: unknown;
}

export function isQuoteMutationLocked(matter: QuoteLockMatterFacts): boolean {
  const status = String(matter.payment_status ?? "unpaid").trim().toLowerCase();
  const amountPaid = Number(matter.amount_paid ?? 0);
  return (
    (Number.isFinite(amountPaid) && amountPaid > 0) ||
    (matter.payment_observed_at !== null && matter.payment_observed_at !== undefined) ||
    (QUOTE_LOCKING_PAYMENT_STATUSES as readonly string[]).includes(status)
  );
}
