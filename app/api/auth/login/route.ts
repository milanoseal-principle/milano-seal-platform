import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function destForRole(role: string): string {
  if (
    role === "founder_admin" || role === "admin" || role === "admin_operator" ||
    role === "ops_manager" || role === "finance" || role === "execution_coordinator" ||
    role === "apostille_coordinator" || role === "finance_operator" || role === "client_support"
  ) return "/dashboard";
  if (role === "client") return "/portal";
  if (role === "alliance" || role === "alliance_partner" || role === "alliance_member") return "/alliance/dashboard";
  if (
    role === "virtual_assistant" || role === "va_manager" || role === "intake_assistant" ||
    role === "scheduling_assistant" || role === "document_coordinator" ||
    role === "translation_coordinator" || role === "courier_assistant" ||
    role === "followup_coordinator" || role === "alliance_support_assistant" ||
    role === "escalation_assistant"
  ) return "/va/dashboard";
  return "/dashboard";
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
    const role = ((user?.user_metadata?.role ?? user?.app_metadata?.role) as string) ?? "";

    if (!role) {
      return NextResponse.json({ ok: false, error: "Access profile missing. Contact Nicholas Milano." }, { status: 403 });
    }

    // Validate safe redirect
    const raw = body.next ?? "";
    const safeNext =
      raw.startsWith("/portal") || raw.startsWith("/alliance") ||
      raw.startsWith("/va") || raw.startsWith("/dashboard")
        ? raw : null;

    return NextResponse.json({
      ok: true,
      redirect: safeNext || destForRole(role),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error. Please try again.",
    }, { status: 500 });
  }
}
