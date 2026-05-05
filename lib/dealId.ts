const DEFAULT_PRODUCTION_BASE =
  "https://wise.com/pay/business/milanosealinternationalllc";

export function buildPaymentLink(dealId: string, amount?: number, currency?: string): string {
  const base = process.env.PAYMENT_BASE_URL?.trim() || DEFAULT_PRODUCTION_BASE;
  const sep = base.includes("?") ? "&" : "?";
  let url = `${base}${sep}ref=${encodeURIComponent(dealId)}`;
  if (amount) url += `&amount=${amount}&currency=${currency ?? "USD"}`;
  return url;
}
