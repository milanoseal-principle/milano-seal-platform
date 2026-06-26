import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { getHomeRouteForRole, isRouteAllowedForRole } from "@/lib/auth/roleRedirect";

export const runtime = "nodejs";

function isNextAllowedForRole(next: string | null, role: string): next is string {
  return !!next && isRouteAllowedForRole(next, role);
}

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

    if (!role) {
      return NextResponse.json({ ok: false, error: "Access profile missing. Contact Nicholas Milano." }, { status: 403 });
    }

    // Validate safe redirect
    const raw = body.next ?? "";
    const requestedNext =
      raw.startsWith("/portal") || raw.startsWith("/alliance") ||
      raw.startsWith("/va") || raw.startsWith("/dashboard")
        ? raw : null;

    return NextResponse.json({
      ok: true,
      redirect: isNextAllowedForRole(requestedNext, role)
        ? requestedNext
        : getHomeRouteForRole(role),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error. Please try again.",
    }, { status: 500 });
  }
}
