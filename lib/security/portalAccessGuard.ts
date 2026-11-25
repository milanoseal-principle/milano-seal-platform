// Portal email-code abuse controls. Uses the existing server-only atomic limiter.
// This module does not create a second counter or expose Matter identifiers.
import { requestLimitScope, retryAfterHeaders, type RequestLimiterDeps, type RequestLimitDecision } from "@/lib/security/publicRequestLimit";

const MAX_BODY_BYTES = 8 * 1024;

export type PortalBody = { token: string; email: string; otp?: string };

function refusal(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers });
}

function limitRefusal(result: RequestLimitDecision): Response | null {
  if (result.allowed) return null;
  return result.status === 429
    ? refusal("Too many requests. Please try again later.", 429, retryAfterHeaders(result))
    : refusal("Portal verification is temporarily unavailable.", 503);
}

export async function parseAndLimitPortalRequest(
  request: Request,
  requireOtp: boolean,
  deps: RequestLimiterDeps,
): Promise<{ body: PortalBody; error?: never } | { error: Response; body?: never }> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { error: refusal("Portal verification is unavailable for this request.", 403) };
  }
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(declaredSize) || declaredSize > MAX_BODY_BYTES) {
    return { error: refusal("Request too large.", 413) };
  }
  const raw = await request.text().catch(() => "");
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return { error: refusal("Request too large.", 413) };
  }
  let value: unknown;
  try { value = JSON.parse(raw); } catch {
    return { error: refusal("Invalid request.", 400) };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: refusal("Invalid request.", 400) };
  }
  const record = value as Record<string, unknown>;
  const token = typeof record.token === "string" ? record.token.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const otp = typeof record.otp === "string" ? record.otp.trim().toUpperCase() : "";
  if (!token || token.length > 256 || !email || email.length > 254 || (requireOtp && !otp)) {
    return { error: refusal("Missing or invalid fields.", 400) };
  }

  // Request-scoped before any Matter lookup. Malformed requests do not consume quota.
  try {
    const userId = await deps.resolveUserId(request).catch(() => null);
    const scope = requestLimitScope(request, userId, deps.env);
    if (!scope) return { error: refusal("Portal verification is temporarily unavailable.", 503) };
    const result = await deps.consume(scope, "portal_auth_client");
    const error = limitRefusal(result.allowed
      ? { allowed: true }
      : { allowed: false, status: 429, retryAfterSeconds: Math.max(1, result.retryAfterSeconds), bucket: "portal_auth_client" });
    if (error) return { error };
  } catch {
    return { error: refusal("Portal verification is temporarily unavailable.", 503) };
  }
  return { body: { token, email, ...(requireOtp ? { otp } : {}) } };
}

export async function limitPortalMatter(
  request: Request,
  dealId: string,
  bucket: "portal_code_send" | "portal_code_attempt",
  deps: RequestLimiterDeps,
): Promise<Response | null> {
  // Synthetic userId namespaces this scope by Matter without storing its identifier.
  const scope = requestLimitScope(request, `portal-matter:${dealId}`, deps.env);
  if (!scope) return refusal("Portal verification is temporarily unavailable.", 503);
  try {
    const result = await deps.consume(scope, bucket);
    return limitRefusal(result.allowed
      ? { allowed: true }
      : { allowed: false, status: 429, retryAfterSeconds: Math.max(1, result.retryAfterSeconds), bucket });
  } catch {
    return refusal("Portal verification is temporarily unavailable.", 503);
  }
}
