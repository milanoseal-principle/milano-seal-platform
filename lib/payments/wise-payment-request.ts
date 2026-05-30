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
 *  1. NEXT_PUBLIC_WISE_BUSINESS_URL → https://wise.com/pay/business/<slug>?amount=X&currency=USD&reference=REF
 *  2. NEXT_PUBLIC_WISE_HANDLE       → https://wise.com/pay/r/<handle>?amount=X&currency=USD&reference=REF
 *  3. WISE_PROFILE_URL (server-side) → appends query params to any base URL
 *  4. No env var → manualFallbackRequired = true, wiseUrl = https://wise.com
 */
export function buildWisePaymentRequest(
  input: WisePaymentRequestInput,
): WisePaymentRequestResult {
  const { amountDue, currency, paymentReference, description } = input;

  const params = new URLSearchParams({
    amount: amountDue.toFixed(2),
    currency,
    reference: paymentReference,
  });

  // Priority 1: full business pay URL (https://wise.com/pay/business/<slug>)
  const wiseBusinessUrl =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_WISE_BUSINESS_URL?.trim()) ||
    null;
  if (wiseBusinessUrl) {
    try {
      const url = new URL(wiseBusinessUrl);
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
      // fall through
    }
  }

  // Priority 2: legacy handle → /pay/r/<handle>
  const wiseHandle =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_WISE_HANDLE?.trim()) ||
    null;
  if (wiseHandle) {
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

  // Priority 3: server-side WISE_PROFILE_URL
  const wiseProfileUrl =
    (typeof process !== "undefined" &&
      process.env.WISE_PROFILE_URL?.trim()) ||
    null;
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
      // fall through
    }
  }

  // No env var — manual fallback
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
