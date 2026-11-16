// Wise delivers transfer state changes asynchronously and may deliver them out of
// order. A late "pending/processing" event must never move a Matter backwards:
// not an invalidated (failed/refunded) payment, and not a payment already
// confirmed by the atomic settlement RPC. Pending carries no payment authority.
export function ignoreLatePendingEvent(deal: {
  payment_status?: string | null;
  payment_confirmed?: boolean | null;
}): boolean {
  const status = String(deal.payment_status ?? "").trim().toLowerCase();
  return deal.payment_confirmed === true || ["failed", "refunded", "paid", "confirmed", "payment_confirmed"].includes(status);
}
