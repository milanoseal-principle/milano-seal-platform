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
      options: {
        emailRedirectTo: `${origin}/auth/callback?flow=signup&next=/portal`,
      },
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

    // FAIL CLOSED on missing email verification. If signUp returned a live
    // session, or a brand-new user is already marked confirmed, then the
    // project's "Confirm email" setting is OFF and this address was auto-
    // trusted without proving mailbox control. Because the portal binds a
    // client to their Matter purely by the (assumed-verified) JWT email,
    // granting the client role here would let anyone who knows an intake email
    // reach that Matter's data. Do not stamp the role; delete the just-created
    // account so no usable, email-squatting login is left behind.
    const autoConfirmed =
      !!data.session ||
      (isNewUser && !!(user!.email_confirmed_at || (user as { confirmed_at?: string }).confirmed_at));
    if (autoConfirmed) {
      if (isNewUser && user) {
        try {
          await createAdminClient().auth.admin.deleteUser(user.id);
        } catch {
          // Best-effort cleanup; the request still fails closed below.
        }
      }
      return NextResponse.json(
        {
          ok: false,
          error:
            "Secure sign-up is temporarily unavailable. Please contact The Milano Seal.",
        },
        { status: 503 },
      );
    }

    if (isNewUser && user) {
      // updateUserById resolves to { error } instead of throwing, so inspect
      // the returned error too — otherwise a failed role stamp would report
      // success and leave the confirmed account permanently roleless (login
      // fails "Access profile missing" and retry can't repair it because the
      // existing-user response has identities=[]). On any failure, delete the
      // account so a retry starts clean.
      let roleError: unknown = null;
      try {
        const { error: updateError } = await createAdminClient().auth.admin.updateUserById(
          user.id,
          { app_metadata: { role: "client" } },
        );
        roleError = updateError;
      } catch (err) {
        roleError = err;
      }
      if (roleError) {
        try {
          await createAdminClient().auth.admin.deleteUser(user.id);
        } catch {
          // Best-effort cleanup.
        }
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
