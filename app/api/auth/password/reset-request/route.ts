import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  // Enumeration-safe response: never reveal whether an address exists.
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const origin = new URL(req.url).origin;

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/recovery`,
    });
  } catch {
    // Keep the same response for existing, missing, rate-limited, or provider-error addresses.
  }

  return NextResponse.json({ ok: true });
}
