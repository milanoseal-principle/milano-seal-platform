import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyRecoveryResult, INVALID_EMAIL_OUTCOME, isPlausibleEmail } from "@/lib/auth/passwordRecovery";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!isPlausibleEmail(email)) {
    return NextResponse.json(INVALID_EMAIL_OUTCOME.body, { status: INVALID_EMAIL_OUTCOME.status });
  }

  const supabase = await createClient();
  const origin = new URL(req.url).origin;

  // Enumeration-safe: Supabase answers an unregistered address exactly like a registered one, so
  // only provider-side refusals (rate limits, delivery outages) are reported, never account existence.
  let outcome;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/recovery`,
    });
    outcome = classifyRecoveryResult(error as { status?: number; code?: string } | null);
  } catch {
    outcome = classifyRecoveryResult({ status: 503 });
  }
  if (!outcome.body.ok) {
    console.warn("[auth] password recovery not accepted", { code: outcome.body.code });
  }
  return NextResponse.json(outcome.body, { status: outcome.status });
}
