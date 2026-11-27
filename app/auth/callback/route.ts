import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DENIED_ROUTE, getHomeRouteForRole, isWorkspaceLoginRedirect, normalizeUserRole } from "@/lib/auth/roleRedirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextOverride = searchParams.get("next");
  const flow = searchParams.get("flow");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { data: sessionData, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData?.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = sessionData.user;
  const actualRole = ((user.app_metadata?.role as string | undefined) ?? "").trim();

  // Email verification and interactive sign-in are intentionally separate.
  // A newly verified client must land on the login gateway on every device,
  // enter the password they just created, and then enter /portal through the
  // normal role-aware login route. This prevents desktop/mobile divergence and
  // avoids leaving a confirmation-created session parked on the order page.
  if (flow === "signup") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?confirmed=1&next=/portal`);
  }

  // Callback, password API and login UI share the same canonical role-home and
  // deep-link policy. Query-string role hints and email matches never grant a role.
  if (!normalizeUserRole(actualRole)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(DENIED_ROUTE, origin));
  }

  const home = getHomeRouteForRole(actualRole);
  const destination = nextOverride && isWorkspaceLoginRedirect(nextOverride, actualRole)
    ? nextOverride
    : home;
  return NextResponse.redirect(new URL(destination, origin));
}
