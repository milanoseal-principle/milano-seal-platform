import { buildPaymentLink as fallbackPaymentLink } from "@/lib/dealId";

export interface WisePaymentRequestInput {
  dealId: string;
  amount: number;
  currency?: string;
  description: string;
  clientName?: string | null;
  clientEmail?: string | null;
}

export interface WisePaymentRequestResult {
  url: string;
  id: string | null;
  mode: "production" | "fallback";
}

const PRODUCTION_BASE = "https://api.wise.com";

export function getWiseBaseUrl(): string {
  return PRODUCTION_BASE;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.WISE_API_TOKEN?.trim() && process.env.WISE_PROFILE_ID?.trim(),
  );
}

function authHeaders(): HeadersInit {
  const token = process.env.WISE_API_TOKEN!.trim();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createWisePaymentRequest(
  input: WisePaymentRequestInput,
): Promise<WisePaymentRequestResult> {
  const fallback = fallbackPaymentLink(
    input.dealId,
    input.amount,
    input.currency,
  );

  if (!isConfigured()) {
    return { url: fallback, id: null, mode: "fallback" };
  }

  const profileId = process.env.WISE_PROFILE_ID!.trim();
  const currency = input.currency ?? "USD";

  const body = {
    amount: input.amount,
    currency,
    description: input.description,
    reference: input.dealId.slice(0, 20),
    ...(input.clientEmail
      ? {
          payer: {
            name: input.clientName ?? undefined,
            email: input.clientEmail,
          },
        }
      : {}),
  };

  try {
    const res = await fetch(
      `${PRODUCTION_BASE}/v3/profiles/${profileId}/payment-requests`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[wise] payment-request failed ${res.status} — body sent: ${JSON.stringify(body)} — response: ${detail}`,
      );
      return { url: fallback, id: null, mode: "fallback" };
    }

    const data = (await res.json()) as {
      id?: string;
      shortUrl?: string;
      shortLink?: string;
      url?: string;
      paymentLink?: string;
      payUrl?: string;
    };

    const liveUrl =
      data.shortUrl ??
      data.shortLink ??
      data.url ??
      data.paymentLink ??
      data.payUrl;
    if (!liveUrl) {
      console.error(
        `[wise] response missing payment URL:`,
        JSON.stringify(data),
      );
      return {
        url: fallback,
        id: data.id ?? null,
        mode: "fallback",
      };
    }

    return { url: liveUrl, id: data.id ?? null, mode: "production" };
  } catch (err) {
    console.error(`[wise] network error:`, err);
    return { url: fallback, id: null, mode: "fallback" };
  }
}

export interface WisePaymentRequestRecord {
  id: string;
  amount: number | null;
  currency: string | null;
  reference: string | null;
  description: string | null;
  status: string | null;
  shortUrl: string | null;
  createdAt: string | null;
  payerName: string | null;
  payerEmail: string | null;
  raw: Record<string, unknown>;
}

function normalizePaymentRequest(
  record: Record<string, unknown>,
): WisePaymentRequestRecord {
  const amount = record.amount as { value?: number } | number | undefined;
  const numericAmount =
    typeof amount === "number"
      ? amount
      : amount && typeof amount === "object" && typeof amount.value === "number"
        ? amount.value
        : null;
  const currency =
    typeof record.currency === "string"
      ? record.currency
      : amount && typeof amount === "object" && "currency" in amount
        ? String((amount as Record<string, unknown>).currency ?? "")
        : null;
  const payer = (record.payer ?? {}) as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    amount: numericAmount,
    currency,
    reference: typeof record.reference === "string" ? record.reference : null,
    description:
      typeof record.description === "string" ? record.description : null,
    status: typeof record.status === "string" ? record.status : null,
    shortUrl:
      (record.shortUrl as string | undefined) ??
      (record.shortLink as string | undefined) ??
      (record.url as string | undefined) ??
      (record.paymentLink as string | undefined) ??
      (record.payUrl as string | undefined) ??
      null,
    createdAt:
      (record.createdAt as string | undefined) ??
      (record.created as string | undefined) ??
      null,
    payerName: typeof payer.name === "string" ? payer.name : null,
    payerEmail: typeof payer.email === "string" ? payer.email : null,
    raw: record,
  };
}


export async function getWisePaymentRequest(
  id: string,
): Promise<WisePaymentRequestRecord | null> {
  if (!isConfigured() || !id) return null;
  const profileId = process.env.WISE_PROFILE_ID!.trim();
  try {
    const res = await fetch(
      `${PRODUCTION_BASE}/v3/profiles/${profileId}/payment-requests/${id}`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return normalizePaymentRequest(data);
  } catch {
    return null;
  }
}

const WISE_PRODUCTION_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvO8vXV+JksBzZAY6GhSO
XdoTCfhXaaiZ+qAbtaDBiu2AGkGVpmEygFmWP4Li9m5+Ni85BhVvZOodM9epgW3F
bA5Q1SexvAF1PPjX4JpMstak/QhAgl1qMSqEevL8cmUeTgcMuVWCJmlge9h7B1CS
D4rtlimGZozG39rUBDg6Qt2K+P4wBfLblL0k4C4YUdLnpGYEDIth+i8XsRpFlogx
CAFyH9+knYsDbR43UJ9shtc42Ybd40Afihj8KnYKXzchyQ42aC8aZ/h5hyZ28yVy
Oj3Vos0VdBIs/gAyJ/4yyQFCXYte64I7ssrlbGRaco4nKF3HmaNhxwyKyJafz19e
HwIDAQAB
-----END PUBLIC KEY-----`;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

let cachedKey: CryptoKey | null = null;

async function getWisePublicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(WISE_PRODUCTION_PUBLIC_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return cachedKey;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function verifyWiseSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader) return false;
  try {
    const key = await getWisePublicKey();
    const sigBytes = base64ToBytes(signatureHeader);
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      sigBytes,
      new TextEncoder().encode(rawBody),
    );
  } catch (err) {
    console.error("[wise] signature verification error:", err);
    return false;
  }
}
