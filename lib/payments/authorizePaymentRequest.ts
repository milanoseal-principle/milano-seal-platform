// Authorization for POST /api/deals/[id]/pay (Wise payment instruction).
//
// A Matter identifier alone never grants authority. The caller must present
// ONE of:
//   - an authorized operator session (server-issued app_metadata role that may
//     reach /dashboard — the same rule proxy.ts applies to operator APIs);
//   - the Matter owner's session (verified email equals the Matter email);
//   - a valid intake payment capability cookie bound to THIS Matter, sent from
//     the same origin, for the retainer payment only (the public intake
//     confirmation flow, before the client has an account).
// With no credential at all the request is refused before any Matter lookup,
// so anonymous probing cannot learn whether an identifier exists.

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { emailsMatch } from "@/lib/auth/clientAccount";
import { isRouteAllowedForRole } from "@/lib/auth/roleRedirect";
import { isAccountDisabled } from "@/lib/auth/server-role";
import {
  PAYMENT_CAPABILITY_COOKIE,
  paymentCapabilityKey,
  readPaymentCapabilityTarget,
} from "@/lib/payments/paymentCapability";

export type PaymentActor =
  | { kind: "operator"; userId: string }
  | { kind: "owner"; userId: string }
  | { kind: "intake_capability" };

export interface PaymentAuthorizationDeps {
  getUser: () => Promise<User | null>;
  loadMatter: (ref: string) => Promise<{ deal_id: string | null; email: string | null } | null>;
  capabilityKey: () => string | null;
  now: () => number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function defaultDeps(): Promise<PaymentAuthorizationDeps> {
  const [{ createClient }, { createAdminClient }] = await Promise.all([
    import("@/lib/supabase/server"),
    import("@/lib/supabase/admin"),
  ]);
  return {
    getUser: async () => {
      try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        return data.user ?? null;
      } catch {
        return null;
      }
    },
    loadMatter: async (ref) => {
      const { data } = await createAdminClient()
        .from("deals")
        .select("deal_id, email")
        .eq(UUID_RE.test(ref) ? "id" : "deal_id", ref)
        .maybeSingle();
      return (data as { deal_id: string | null; email: string | null } | null) ?? null;
    },
    capabilityKey: () => paymentCapabilityKey(),
    now: () => Date.now(),
  };
}

function deny(status: 401 | 403 | 404) {
  const error = status === 404 ? "Deal not found" : "PAYMENT_AUTHORIZATION_REQUIRED";
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Same-origin request (cookie authority must not be usable cross-site). */
function sameOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  try {
    return origin !== null && origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function authorizePaymentRequest(
  request: Request,
  matterRef: string,
  paymentType: string,
  deps?: PaymentAuthorizationDeps,
): Promise<{ ok: true; actor: PaymentActor } | { ok: false; response: NextResponse }> {
  const d = deps ?? (await defaultDeps());
  // Only a cryptographically valid, unexpired capability counts as a
  // credential; a forged or expired cookie is the same as none.
  const capabilityTarget = readPaymentCapabilityTarget(
    readCookie(request, PAYMENT_CAPABILITY_COOKIE),
    d.capabilityKey(),
    d.now(),
  );
  const rawUser = await d.getUser();
  const user = rawUser && !isAccountDisabled(rawUser) ? rawUser : null;
  if (!user && !capabilityTarget) return { ok: false, response: deny(401) };

  const role = (user?.app_metadata?.role as string | undefined) ?? null;
  const operator = !!user && isRouteAllowedForRole("/dashboard", role);

  const matter = matterRef ? await d.loadMatter(matterRef) : null;
  // Only operators learn that a Matter does not exist; everyone else gets the
  // same denial as an unauthorized request (no existence oracle).
  if (!matter) return { ok: false, response: deny(operator ? 404 : 403) };

  if (operator && user) return { ok: true, actor: { kind: "operator", userId: user.id } };
  // Ownership requires a CONFIRMED email, the same rule as lib/portalAuth.
  if (user && user.email_confirmed_at && emailsMatch(user.email, matter.email)) {
    return { ok: true, actor: { kind: "owner", userId: user.id } };
  }

  if (
    capabilityTarget &&
    paymentType === "retainer" &&
    sameOrigin(request) &&
    typeof matter.deal_id === "string" &&
    capabilityTarget === matter.deal_id
  ) {
    return { ok: true, actor: { kind: "intake_capability" } };
  }

  return { ok: false, response: deny(403) };
}
