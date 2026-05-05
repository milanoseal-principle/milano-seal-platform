const DEFAULT_PRODUCTION_BASE =
  "https://wise.com/pay/business/milanosealinternationalllc";

export function buildPaymentLink(dealId: string, _amount?: number, _currency?: string): string {
  const base = process.env.PAYMENT_BASE_URL?.trim() || DEFAULT_PRODUCTION_BASE;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}ref=${encodeURIComponent(dealId)}`;
}
