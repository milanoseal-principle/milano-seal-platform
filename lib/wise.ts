/**
 * Wise (TransferWise) Business API client.
 *
 * Wise has two environments:
 *   - Sandbox / test:  https://api.sandbox.transferwise.tech
 *   - Production:      https://api.wise.com
 *
 * Switch between them via the WISE_MODE env var ("test" | "production",
 * default "test" so a fresh checkout never accidentally hits real money).
 *
 * Required env vars (when calling the real API):
 *   WISE_MODE         - "test" or "production"
 *   WISE_API_TOKEN    - personal/business API token from Wise
 *   WISE_PROFILE_ID   - numeric Wise business profile id
 *   WISE_WEBHOOK_SECRET - HMAC secret for /api/webhook/wise (you set
 *                        this when registering the webhook in Wise)
 *
 * Optional:
 *   PAYMENT_BASE_URL  - override the deterministic-fallback URL used
 *                       when no API token is configured (dev convenience)
 */

import { buildPaymentLink as fallbackPaymentLink } from "@/lib/dealId";

export type WiseMode = "test" | "production";

export interface WisePaymentRequestInput {
  dealId: string;
  amount: number;
  currency?: string; // default USD
  description: string;
  clientName?: string | null;
  clientEmail?: string | null;
}

export interface WisePaymentRequestResult {
  /** The URL the client opens to pay (real Wise short URL or fallback). */
  url: string;
  /** Wise's payment request id (null when we used the fallback URL). */
  id: string | null;
  /** Which mode this URL was created in, or "fallback" if no API call. */
  mode: WiseMode | "fallback";
}

export function getWiseMode(): WiseMode {
  return process.env.WISE_MODE === "production" ? "production" : "test";
}

export function getWiseBaseUrl(): string {
  return getWiseMode() === "production"
    ? "https://api.wise.com"
    : "https://api.sandbox.transferwise.tech";
}

function isConfigured(): boolean {
  return Boolean(
    process.env.WISE_API_TOKEN?.trim() && process.env.WISE_PROFILE_ID?.trim()
  );
}

/**
 * Create a real Wise payment request. Returns the payable short URL.
 *
 * If WISE_API_TOKEN / WISE_PROFILE_ID aren't set, we return the
 * deterministic fallback link so dev environments still produce a
 * clickable URL on the deal-detail page.
 */
export async function createWisePaymentRequest(
  input: WisePaymentRequestInput
): Promise<WisePaymentRequestResult> {
  if (!isConfigured()) {
    return {
      url: fallbackPaymentLink(input.dealId),
      id: null,
      mode: "fallback",
    };
  }

  const mode = getWiseMode();
  const base = getWiseBaseUrl();
  const profileId = process.env.WISE_PROFILE_ID!.trim();
  const token = process.env.WISE_API_TOKEN!.trim();

  // Wise Business "Payment Request" endpoint (v3). The exact field
  // names follow the Wise docs at the time of writing — if Wise updates
  // their schema, this is the only place that needs to change.
  const url = `${base}/v3/profiles/${profileId}/payment-requests`;
  const body = {
    balanceId: undefined, // Wise picks the default balance for the currency
    amountValue: input.amount,
    currency: input.currency ?? "USD",
    description: input.description,
    reference: input.dealId.slice(0, 20), // Wise reference length cap
    message: input.description,
    payer: input.clientEmail
      ? {
          name: input.clientName ?? undefined,
          email: input.clientEmail,
        }
      : undefined,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[wise] payment-request failed ${res.status} (${mode}):`,
        detail
      );
      // Fall back to the deterministic URL so the operator still has
      // SOMETHING to send the client while we debug.
      return {
        url: fallbackPaymentLink(input.dealId),
        id: null,
        mode: "fallback",
      };
    }

    const data = (await res.json()) as {
      id?: string;
      shortUrl?: string;
      shortLink?: string;
      url?: string;
      paymentLink?: string;
    };

    const liveUrl = data.shortUrl ?? data.shortLink ?? data.url ?? data.paymentLink;
    if (!liveUrl) {
      console.error("[wise] response missing payment URL:", data);
      return {
        url: fallbackPaymentLink(input.dealId),
        id: data.id ?? null,
        mode: "fallback",
      };
    }

    return { url: liveUrl, id: data.id ?? null, mode };
  } catch (err) {
    console.error("[wise] network error:", err);
    return {
      url: fallbackPaymentLink(input.dealId),
      id: null,
      mode: "fallback",
    };
  }
}

/**
 * Verify the HMAC signature Wise sends on webhook deliveries.
 * Returns true if the signature matches, false otherwise.
 *
 * Wise's signature header is "X-Signature-SHA256" containing the
 * base64-encoded HMAC of the raw request body using your webhook
 * secret.
 */
export async function verifyWiseSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const secret = process.env.WISE_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return constantTimeEqual(expected, signatureHeader);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
