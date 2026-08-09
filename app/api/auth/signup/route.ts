import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateSignupCredentials,
  SIGNUP_CONFIRMATION_MESSAGE,
} from "@/lib/auth/clientAccount";

export const runtime = "nodejs";

// Client self-service account creation.
//
// Rules (locked):
//  - Create the account with the ANON client via signUp() so Supabase's email
//    confirmation is enforced. NEVER auto-confirm here (no admin.createUser
//    with email_confirm). The confirmed JWT email is what the email-based
//    portal RLS trusts, so an unconfirmed account can reach no Matter.
//  - The authorization role lives in service-role-controlled app_metadata.
//    signUp() can only write user_metadata (untrusted, ignored for authz), so
//    a single service-role call stamps app_metadata.role='client' on the newly
//    created user id. This is the only privileged step and it assigns nothing
//    beyond the client role.
//  - Enumeration-safe: the response never reveals whether the email already
//    exists or whether a Matter exists for it. Matter binding is automatic via
//    RLS on first confirmed login — this route writes no deal data.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const check = validateSignupCredentials(body.email, body.password);
    if (!check.ok) {
      return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
    }

    const supabase = await createClient();
    const origin = new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({
      email: check.email,
      password: String(body.password),
      options: { emailRedirectTo: `${origin}/login?next=/portal` },
    });

    if (error) {
      // Rate-limit / provider errors: surface a generic, non-enumerating message.
      const status = error.status && error.status >= 400 && error.status < 500 ? 400 : 500;
      return NextResponse.json(
        { ok: false, error: "We couldn't complete sign-up right now. Please try again." },
        { status },
      );
    }

    // A brand-new user has a non-empty identities array. When the email is
    // already registered, Supabase (with confirmations on) returns an
    // obfuscated user with identities=[] — do NOT stamp a role or otherwise
    // touch that existing account; respond identically to avoid enumeration.
    const user = data.user;
    const isNewUser = !!user && Array.isArray(user.identities) && user.identities.length > 0;

    if (isNewUser && user) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { role: "client" },
        });
      } catch {
        // If role stamping fails, the account still exists unconfirmed with no
        // role — login will fail closed ("Access profile missing") rather than
        // grant unintended access. Surface a generic retry rather than leak.
        return NextResponse.json(
          { ok: false, error: "We couldn't complete sign-up right now. Please try again." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true, message: SIGNUP_CONFIRMATION_MESSAGE });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isNetworkErr =
      msg === "fetch failed" ||
      msg.includes("ENOTFOUND") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("not configured");
    return NextResponse.json(
      {
        ok: false,
        error: isNetworkErr
          ? "Authentication service unavailable. Please try again shortly."
          : "Unexpected error. Please try again.",
      },
      { status: 500 },
    );
  }
}
