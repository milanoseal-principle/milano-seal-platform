// Durable request limits for public cost- and abuse-bearing endpoints.
//
// Server-side only. Each request consumes one unit from a per-client bucket and,
// for paid-AI endpoints, a global daily bucket, through the atomic Postgres RPC
// public.consume_public_request_limit (migration 20261125120000). Ceilings and
// windows live in SQL; callers only name buckets.
//
// Scope: an authenticated (non-disabled) user is limited by user id; anyone
// else by client address. Either is reduced to an HMAC before it leaves this
// process, so no raw address or user id is stored.
//
// Fail closed: a missing HMAC secret or a limiter/storage error is reported as
// unavailable (503), never as allowed.

import { createHmac } from "node:crypto";

export type PublicRequestBucket = "assistant" | "intake_extract" | "intake_submit";
export type PublicGlobalBucket = "assistant_global" | "intake_extract_global";

export type RequestLimitDecision =
  | { allowed: true }
  | { allowed: false; status: 429; retryAfterSeconds: number; bucket: string }
  | { allowed: false; status: 503 };

export type ConsumeLimit = (scopeHash: string, bucket: string) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;

export interface RequestLimiterDeps {
  env: Record<string, string | undefined>;
  /** Authenticated, non-disabled user id, or null for anonymous callers. */
  resolveUserId: (request: Request) => Promise<string | null>;
  consume: ConsumeLimit;
}

export function clientAddress(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown";
}

function limitSecret(env: Record<string, string | undefined>): string | null {
  const secret = env.PUBLIC_REQUEST_LIMIT_HMAC_SECRET?.trim() || env.CRON_SECRET?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return secret || null;
}

/** HMAC scope key for a caller (64 hex), or null when no secret is configured. */
export function requestLimitScope(request: Request, userId: string | null, env: Record<string, string | undefined>): string | null {
  const secret = limitSecret(env);
  if (!secret) return null;
  const subject = userId ? `user:${userId}` : `ip:${clientAddress(request.headers)}`;
  return createHmac("sha256", secret).update(subject).digest("hex");
}

/**
 * Consumes the client bucket, then (only if that allowed) the global bucket.
 * A request denied by its own client limit never spends global budget.
 */
export async function enforcePublicRequestLimit(
  request: Request,
  buckets: { client: PublicRequestBucket; global?: PublicGlobalBucket },
  deps: RequestLimiterDeps,
): Promise<RequestLimitDecision> {
  try {
    const userId = await deps.resolveUserId(request).catch(() => null);
    const scope = requestLimitScope(request, userId, deps.env);
    if (!scope) return { allowed: false, status: 503 };
    const client = await deps.consume(scope, buckets.client);
    if (!client.allowed) return { allowed: false, status: 429, retryAfterSeconds: Math.max(1, client.retryAfterSeconds), bucket: buckets.client };
    if (buckets.global) {
      const global = await deps.consume("global", buckets.global);
      if (!global.allowed) return { allowed: false, status: 429, retryAfterSeconds: Math.max(1, global.retryAfterSeconds), bucket: buckets.global };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, status: 503 };
  }
}

/** Retry-After header for a 429 decision. */
export function retryAfterHeaders(decision: RequestLimitDecision): Record<string, string> {
  return decision.allowed === false && decision.status === 429 ? { "Retry-After": String(decision.retryAfterSeconds) } : {};
}

/** Production dependencies: Supabase session for the actor, service RPC for the counter. */
export async function defaultRequestLimiterDeps(): Promise<RequestLimiterDeps> {
  const [{ createClient }, { createAdminClient }, { isAccountDisabled }] = await Promise.all([
    import("@/lib/supabase/server"),
    import("@/lib/supabase/admin"),
    import("@/lib/auth/server-role"),
  ]);
  return {
    env: process.env,
    resolveUserId: async () => {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      return user && !isAccountDisabled(user) ? user.id : null;
    },
    consume: async (scopeHash, bucket) => {
      const { data, error } = await createAdminClient().rpc("consume_public_request_limit", {
        p_scope_hash: scopeHash,
        p_bucket: bucket,
      });
      if (error) throw Error("PUBLIC_REQUEST_LIMIT_UNAVAILABLE");
      const row = (Array.isArray(data) ? data[0] : data) as { allowed?: unknown; retry_after_seconds?: unknown } | null;
      if (!row || typeof row.allowed !== "boolean") throw Error("PUBLIC_REQUEST_LIMIT_UNAVAILABLE");
      return { allowed: row.allowed, retryAfterSeconds: Number(row.retry_after_seconds) || 0 };
    },
  };
}
