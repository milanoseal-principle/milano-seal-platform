import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role");
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

  if (role === "client") {
    return NextResponse.redirect(`${origin}/portal`);
  }
  if (role === "operator") {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  if (nextOverride) {
    const safe =
      nextOverride.startsWith("/dashboard") ||
      nextOverride.startsWith("/portal") ||
      nextOverride.startsWith("/admin");
    if (safe) {
      return NextResponse.redirect(`${origin}${nextOverride}`);
    }
  }

  const userEmail = sessionData.user.email?.toLowerCase();
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
