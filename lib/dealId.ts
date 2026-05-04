/**
 * Deal ID + Wise payment link generator.
 *
 * Ported from artifacts/api-server/src/lib/dealId.ts (Milano-Seal).
 *
 * Why we do this server-side: Wise's "pay business" URL is deterministic
 * — it just needs the business slug and a `ref` query param. We don't
 * need to call any Wise API. That means every matter gets a real,
 * working payment link the moment intake completes, with no API keys
 * or retries.
 */

const DEFAULT_PAYMENT_BASE_URL =
  "https://wise.com/pay/business/milanosealinternationalllc";

/**
 * Build a Wise payment link for a deal. The base URL can be overridden
 * via the PAYMENT_BASE_URL env var (e.g. to point at a different Wise
 * business slug or a sandbox).
 */
export function buildPaymentLink(dealId: string): string {
  const base =
    process.env.PAYMENT_BASE_URL?.trim() || DEFAULT_PAYMENT_BASE_URL;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}ref=${encodeURIComponent(dealId)}`;
}
