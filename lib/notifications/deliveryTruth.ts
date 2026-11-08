import { createHmac, timingSafeEqual } from "node:crypto";

// Resend webhooks are signed with the Svix scheme: base64(HMAC-SHA256(secret, `${id}.${timestamp}.${body}`)).
export function verifySvixSignature(input: {
  secret: string | undefined;
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): boolean {
  const { secret, id, timestamp, signatureHeader, body } = input;
  if (!secret || !id || !timestamp || !signatureHeader) return false;
  const ts = Number(timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > (input.toleranceSeconds ?? 300)) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatureHeader.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const candidate = Buffer.from(value, "base64");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

export type ProviderDeliveryUpdate =
  | { delivery_status: "delivered"; delivered_at: string }
  | { delivery_status: "bounced"; bounced_at: string; error_classification: "bounce" }
  | { delivery_status: "suppressed"; suppressed_at: string; error_classification: "complaint" | "suppressed" }
  | { delivery_status: "failed"; failed_at: string; error_classification: "provider_failure" };

// Only authoritative provider events change delivery truth. "sent" means provider acceptance.
export function mapProviderEvent(type: string, at: string): ProviderDeliveryUpdate | null {
  switch (type) {
    case "email.delivered": return { delivery_status: "delivered", delivered_at: at };
    case "email.bounced": return { delivery_status: "bounced", bounced_at: at, error_classification: "bounce" };
    case "email.complained": return { delivery_status: "suppressed", suppressed_at: at, error_classification: "complaint" };
    case "email.suppressed": return { delivery_status: "suppressed", suppressed_at: at, error_classification: "suppressed" };
    case "email.failed": return { delivery_status: "failed", failed_at: at, error_classification: "provider_failure" };
    default: return null;
  }
}

export function notificationIdempotencyKey(matterId: string, type: string, recipient: string) {
  return `${matterId}:${type}:${recipient.trim().toLowerCase()}`;
}
