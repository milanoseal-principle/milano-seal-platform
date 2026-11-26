import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DENIED_ROUTE, getHomeRouteForRole, isWorkspaceLoginRedirect } from "@/lib/auth/roleRedirect";
import { resolveServerRole } from "@/lib/auth/server-role";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; next?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : error.message,
      }, { status: 401 });
    }

    const user = data.user;
    const role = user ? await resolveServerRole(user) : "";

    const home = getHomeRouteForRole(role);
    if (home === DENIED_ROUTE) {
      await supabase.auth.signOut();
      return NextResponse.json({ ok: false, error: "Access profile missing. Contact Nicholas Milano." }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      role,
      redirect: isWorkspaceLoginRedirect(body.next, role) ? body.next : home,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Supabase unreachable — env vars missing or wrong project URL
    const isNetworkErr = msg === "fetch failed" || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("not configured");
    return NextResponse.json({
      ok: false,
      error: isNetworkErr
        ? "Authentication service unavailable. Environment configuration required."
        : msg || "Unexpected error. Please try again.",
    }, { status: 500 });
  }
}
