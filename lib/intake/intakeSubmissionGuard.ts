// Abuse controls for POST /api/intake (public Matter creation), applied before
// any Matter, invoice, capability or email is created.
//
// Anonymous intake stays available. Using the same controls as the other public
// forms (lib/acquisition/*) plus the durable limiter:
//   - a foreign Origin is refused (403); same-origin and Origin-less callers pass
//   - body capped at MAX_INTAKE_BODY_BYTES, declared and actual (413)
//   - body must be a JSON object (400)
//   - durable per-client limit (bucket intake_submit, 5 per hour per user or
//     client address) -> 429 + Retry-After; limiter unavailable -> 503.
// An authorized operator (the same role check proxy.ts applies to /dashboard)
// is not subject to the public per-client limit: the dashboard intake tools
// create Matters on clients' behalf through this route.
// Every refusal is an explicit failure (success: false); nothing is reported as
// received unless the canonical intake handler actually persisted it.

import { NextRequest, NextResponse } from "next/server";
import { retryAfterHeaders, type RequestLimitDecision } from "@/lib/security/publicRequestLimit";

export const MAX_INTAKE_BODY_BYTES = 64 * 1024;

export interface IntakeSubmissionDeps {
  isOperator: (request: Request) => Promise<boolean>;
  limit: (request: Request) => Promise<RequestLimitDecision>;
  findReplay?: (request: NextRequest, body: Record<string, unknown>) => Promise<NextResponse | null>;
}

function refuse(status: 400 | 403 | 413 | 429 | 503, code: string, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json(
    { success: false, error, code, retryable: status === 429 || status === 503 },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

export async function guardIntakeSubmission(
  request: NextRequest,
  deps: IntakeSubmissionDeps,
): Promise<
  | { ok: true; request: NextRequest; operator: boolean }
  | { ok: false; response: NextResponse; replay?: true }
> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { ok: false, response: refuse(403, "INTAKE_FOREIGN_ORIGIN", "Please submit from the Milano website.") };
  }

  const tooLarge = () => refuse(413, "INTAKE_PAYLOAD_TOO_LARGE", "This request is too large. Please shorten your notes and try again.");
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_INTAKE_BODY_BYTES) return { ok: false, response: tooLarge() };
  const raw = await request.text().catch(() => "");
  if (Buffer.byteLength(raw, "utf8") > MAX_INTAKE_BODY_BYTES) return { ok: false, response: tooLarge() };

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, response: refuse(400, "INTAKE_INVALID_JSON", "We could not read this request. Please try again.") };
  }

  const operator = await deps.isOperator(request).catch(() => false);
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  const guardedRequest = new NextRequest(request.url, { method: "POST", headers, body: raw });

  if (!operator && deps.findReplay) {
    let replay: NextResponse | null;
    try {
      replay = await deps.findReplay(guardedRequest, body as Record<string, unknown>);
    } catch {
      return { ok: false, response: refuse(503, "INTAKE_IDEMPOTENCY_UNAVAILABLE", "We could not verify this request safely. Please retry shortly.") };
    }
    if (replay) return { ok: false, response: replay, replay: true };
  }

  if (!operator) {
    const decision = await deps.limit(guardedRequest);
    if (!decision.allowed) {
      if (decision.status === 503) {
        return { ok: false, response: refuse(503, "INTAKE_LIMIT_UNAVAILABLE", "We could not receive your request right now. Please try again shortly.") };
      }
      return {
        ok: false,
        response: refuse(429, "INTAKE_RATE_LIMITED", "Several requests were just submitted from this connection. Please wait a few minutes and try again.", retryAfterHeaders(decision)),
      };
    }
  }

  return { ok: true, request: guardedRequest, operator };
}

/** Production operator check: same rule proxy.ts applies to operator APIs. */
export async function isAuthorizedOperator(): Promise<boolean> {
  const [{ createClient }, { isAccountDisabled }, { isRouteAllowedForRole }] = await Promise.all([
    import("@/lib/supabase/server"),
    import("@/lib/auth/server-role"),
    import("@/lib/auth/roleRedirect"),
  ]);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || isAccountDisabled(user)) return false;
  return isRouteAllowedForRole("/dashboard", (user.app_metadata?.role as string | undefined) ?? null);
}
