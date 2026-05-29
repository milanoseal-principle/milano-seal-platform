const DEFAULT_PRODUCTION_BASE =
  "https://wise.com/pay/business/milanosealinternationalllc";

export function buildPaymentLink(
  dealId: string,
  amount?: number,
  currency?: string,
): string {
  // Prefer handle-based prefilled link (NEXT_PUBLIC_WISE_HANDLE)
  const wiseHandle = process.env.NEXT_PUBLIC_WISE_HANDLE?.trim();
  if (wiseHandle) {
    const params = new URLSearchParams({ reference: dealId });
    if (amount != null && Number.isFinite(amount) && amount > 0) {
      params.set("amount", amount.toFixed(2));
      params.set("currency", currency ?? "USD");
    }
    return `https://wise.com/pay/r/${encodeURIComponent(wiseHandle)}?${params.toString()}`;
  }

  // Fall back to profile URL with query params
  const base = process.env.PAYMENT_BASE_URL?.trim() || DEFAULT_PRODUCTION_BASE;
  const url = new URL(base);
  url.searchParams.set("ref", dealId);
  if (amount != null && Number.isFinite(amount) && amount > 0) {
    url.searchParams.set("amount", amount.toFixed(2));
    url.searchParams.set("currency", currency ?? "USD");
  }
  return url.toString();
}
