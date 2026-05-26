import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleHint = searchParams.get("role"); // "client" | "operator" — UI hint only
  const nextOverride = searchParams.get("next");

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
  const actualRole =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  // Virtual assistants → VA portal
  if (
    actualRole === "virtual_assistant" ||
    [
      "intake_assistant", "scheduling_assistant", "document_coordinator",
      "translation_coordinator", "courier_assistant", "followup_coordinator",
      "alliance_support_assistant", "escalation_assistant",
    ].includes(actualRole)
  ) {
    return NextResponse.redirect(`${origin}/va/dashboard`);
  }

  // Alliance partners and field operators → alliance portal
  if (actualRole === "alliance_partner" || actualRole === "operator") {
    return NextResponse.redirect(`${origin}/alliance/dashboard`);
  }

  // Admin roles → dashboard (respect a safe next= override)
  if (["admin", "ops_manager", "finance"].includes(actualRole)) {
    if (nextOverride) {
      const safe =
        nextOverride.startsWith("/dashboard") ||
        nextOverride.startsWith("/portal") ||
        nextOverride.startsWith("/admin") ||
        nextOverride.startsWith("/alliance");
      if (safe) return NextResponse.redirect(`${origin}${nextOverride}`);
    }
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Explicit client hint (magic link) or client role → portal
  if (roleHint === "client" || actualRole === "client") {
    return NextResponse.redirect(`${origin}/portal`);
  }

  // Fallback: check email against deals (new client with no role metadata yet)
  const userEmail = user.email?.toLowerCase();
  if (userEmail) {
    try {
      const admin = createAdminClient();
      const { data: dealMatch } = await admin
        .from("deals")
        .select("id")
        .ilike("email", userEmail)
        .limit(1)
        .maybeSingle();
      if (dealMatch) {
        return NextResponse.redirect(`${origin}/portal`);
      }
    } catch {}
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
