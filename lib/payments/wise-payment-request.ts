export type WisePaymentRequestInput = {
  matterReference: string;
  paymentReference: string;
  clientName?: string;
  amountDue: number;
  currency: "USD";
  description: string;
  returnUrl?: string;
};

export type WisePaymentRequestResult = {
  amountDue: number;
  currency: "USD";
  paymentReference: string;
  description: string;
  wiseUrl: string;
  isPrefilled: boolean;
  manualFallbackRequired: boolean;
};

/**
 * Build a Wise payment request for a given matter.
 *
 * Prefill priority:
 *  1. NEXT_PUBLIC_WISE_HANDLE  → https://wise.com/pay/r/<handle>?amount=X&currency=USD&reference=REF
 *  2. WISE_PROFILE_URL (server-side) → appends query params if possible
 *  3. No env var → manualFallbackRequired = true, wiseUrl = https://wise.com
 */
export function buildWisePaymentRequest(
  input: WisePaymentRequestInput,
): WisePaymentRequestResult {
  const { amountDue, currency, paymentReference, description } = input;

  // Attempt to get handle or profile URL
  const wiseHandle =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_WISE_HANDLE?.trim()) ||
    null;
  const wiseProfileUrl =
    (typeof process !== "undefined" &&
      process.env.WISE_PROFILE_URL?.trim()) ||
    null;

  // Build prefilled URL if handle is available
  if (wiseHandle) {
    const params = new URLSearchParams({
      amount: amountDue.toFixed(2),
      currency,
      reference: paymentReference,
    });
    const wiseUrl = `https://wise.com/pay/r/${encodeURIComponent(wiseHandle)}?${params.toString()}`;
    return {
      amountDue,
      currency,
      paymentReference,
      description,
      wiseUrl,
      isPrefilled: true,
      manualFallbackRequired: false,
    };
  }

  // Attempt to append params to WISE_PROFILE_URL if available
  if (wiseProfileUrl) {
    try {
      const url = new URL(wiseProfileUrl);
      url.searchParams.set("amount", amountDue.toFixed(2));
      url.searchParams.set("currency", currency);
      url.searchParams.set("reference", paymentReference);
      return {
        amountDue,
        currency,
        paymentReference,
        description,
        wiseUrl: url.toString(),
        isPrefilled: true,
        manualFallbackRequired: false,
      };
    } catch {
      // Invalid URL — fall through to manual fallback
    }
  }

  // No env var configured — manual fallback required
  return {
    amountDue,
    currency,
    paymentReference,
    description,
    wiseUrl: "https://wise.com",
    isPrefilled: false,
    manualFallbackRequired: true,
  };
}
