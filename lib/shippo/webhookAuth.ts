import { createHmac, timingSafeEqual } from "crypto";

export type ShippoWebhookAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

function equalHex(actual: string, expected: string): boolean {
  if (!/^[0-9a-f]+$/i.test(actual) || actual.length % 2 !== 0) return false;
  const left = Buffer.from(actual, "hex");
  const right = Buffer.from(expected, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyShippoHmac(
  rawBody: string,
  signature: string | null,
  secret = process.env.SHIPPO_WEBHOOK_SECRET?.trim(),
): ShippoWebhookAuthResult {
  if (!secret) {
    return { ok: false, status: 500, error: "Server configuration error" };
  }
  if (!signature) {
    return { ok: false, status: 401, error: "Missing signature" };
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!equalHex(signature.trim(), expected)) {
    return { ok: false, status: 401, error: "Invalid signature" };
  }
  return { ok: true };
}
