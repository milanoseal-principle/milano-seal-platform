// Intake payment capability — a server-issued, short-lived, Matter-bound
// authority that lets a just-submitted public intake request ITS OWN retainer
// payment instruction without an account.
//
// Mirrors the existing intake upload capability (lib/uploads/authorization):
// an HMAC-signed claim {target, scope, expires} delivered only as an httpOnly,
// SameSite=Strict cookie, so it is never visible to page script, URLs, logs or
// analytics, and nothing is stored server-side (no plaintext token at rest).
// Scope "intake_payment" is distinct from "intake_upload"; a token for one can
// never satisfy the other. Revocation: expiry (30 minutes) or key rotation.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const PAYMENT_CAPABILITY_COOKIE = "ms_intake_payment_cap";
export const PAYMENT_CAPABILITY_SCOPE = "intake_payment";
export const PAYMENT_CAPABILITY_TTL_MS = 30 * 60 * 1000;

export function paymentCapabilityKey(env: Record<string, string | undefined> = process.env): string | null {
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key ? key : null;
}

export function issuePaymentCapability(target: string, key: string, now = Date.now()): string {
  if (!target || !key) throw Error("PAYMENT_AUTHORITY_UNCONFIGURED");
  const encoded = Buffer.from(
    JSON.stringify({ target, scope: PAYMENT_CAPABILITY_SCOPE, expires: now + PAYMENT_CAPABILITY_TTL_MS }),
  ).toString("base64url");
  return `${encoded}.${createHmac("sha256", key).update(encoded).digest("base64url")}`;
}

/**
 * The Matter target of an untampered, unexpired intake_payment claim, or null.
 * Lets callers reject a forged/expired cookie before any Matter lookup.
 */
export function readPaymentCapabilityTarget(
  token: string | undefined | null,
  key: string | null | undefined,
  now = Date.now(),
): string | null {
  if (!token || !key) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra !== undefined) return null;
  const expected = createHmac("sha256", key).update(encoded).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const claim = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Record<string, unknown>;
    const expires = Number(claim.expires);
    const valid =
      typeof claim.target === "string" &&
      claim.target.length > 0 &&
      claim.scope === PAYMENT_CAPABILITY_SCOPE &&
      Number.isFinite(expires) &&
      expires > now &&
      expires <= now + PAYMENT_CAPABILITY_TTL_MS;
    return valid ? (claim.target as string) : null;
  } catch {
    return null;
  }
}

/** True only for an untampered, unexpired intake_payment claim for exactly `target`. */
export function verifyPaymentCapability(
  token: string | undefined | null,
  target: string,
  key: string | null | undefined,
  now = Date.now(),
): boolean {
  return !!target && readPaymentCapabilityTarget(token, key, now) === target;
}

/** Attaches the capability cookie to a successful public intake response for the Matter it created. */
export async function bindIntakePaymentCapability(response: NextResponse): Promise<NextResponse> {
  if (!response.ok) return response;
  const body = (await response.clone().json().catch(() => null)) as { success?: unknown; deal_id?: unknown } | null;
  const key = paymentCapabilityKey();
  if (body?.success && typeof body.deal_id === "string" && body.deal_id && key) {
    response.cookies.set(PAYMENT_CAPABILITY_COOKIE, issuePaymentCapability(body.deal_id, key), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: PAYMENT_CAPABILITY_TTL_MS / 1000,
      path: "/api",
    });
  }
  return response;
}
