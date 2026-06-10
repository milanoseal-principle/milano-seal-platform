// Wise payment URL fallback.
// The live deals table may not have a wise_payment_url column; in that case
// the portal generates the Wise business payment link from the reference and
// amount due so the client can still pay. Matching on the webhook side is
// always done by wise_reference, never by URL.

export function buildWisePaymentUrl(opts: {
  wiseReference: string;
  amountDue: number;
  currency?: string | null;
}): string | null {
  const ref = opts.wiseReference?.trim();
  const amount = Number(opts.amountDue);
  if (!ref || !Number.isFinite(amount) || amount <= 0) return null;

  const currency = (opts.currency ?? "USD").trim().toUpperCase();
  return `https://wise.com/pay/business/themilanoseal?reference=${encodeURIComponent(ref)}&amount=${amount}&currency=${encodeURIComponent(currency)}`;
}
