import { buildPaymentLink } from "@/lib/dealId";

export interface WisePaymentRequestInput {
  dealId: string;
  amount: number;
  currency?: string;
  description: string;
  clientName?: string | null;
  clientEmail?: string | null;
  redirectUrl?: string | null;
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

/**
 * Wise payment collection uses the canonical public Wise business/handle link.
 * The previous implementation attempted an undocumented
 * /v3/profiles/:profile/payment-requests endpoint and produced a production
 * 404 before falling back to the same link. Do not call an unsupported API.
 *
 * This creates no paid state. The Matter reference + amount travel to Wise;
 * canonical settlement/reconciliation remains the only payment authority.
 */
export async function createWisePaymentRequest(
  input: WisePaymentRequestInput,
): Promise<WisePaymentRequestResult> {
  const url = buildPaymentLink(
    input.dealId,
    input.amount,
    input.currency ?? "USD",
  );
  return { url, id: null, mode: "production" };
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

/**
 * No Wise "payment request" object is created by the canonical collection
 * path, so there is no request resource to fetch. Reconciliation is handled by
 * the existing Wise settlement/webhook transaction path instead.
 */
export async function getWisePaymentRequest(
  _id: string,
): Promise<WisePaymentRequestRecord | null> {
  return null;
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

/** Shared cryptographic operation; callers cannot change the production wrapper's key. */
export async function verifyWiseSignatureWithKey(rawBody: string, signatureHeader: string | null, key: CryptoKey): Promise<boolean> {
  if (!signatureHeader) return false;
  try {
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, base64ToBytes(signatureHeader), new TextEncoder().encode(rawBody));
  } catch { return false; }
}

export async function verifyWiseSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false;
  try { return await verifyWiseSignatureWithKey(rawBody, signatureHeader, await getWisePublicKey()); }
  catch { return false; }
}
