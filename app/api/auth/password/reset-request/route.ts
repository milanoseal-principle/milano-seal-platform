import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyRecoveryResult, INVALID_EMAIL_OUTCOME, isPlausibleEmail, RECOVERY_UNREACHABLE_OUTCOME } from "@/lib/auth/passwordRecovery";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!isPlausibleEmail(email)) {
    return NextResponse.json(INVALID_EMAIL_OUTCOME.body, { status: INVALID_EMAIL_OUTCOME.status });
  }

  const supabase = await createClient();
  const origin = new URL(req.url).origin;

  // Enumeration-safe: account-dependent provider errors are answered like an accepted request
  // (see classifyRecoveryResult); only address-independent refusals reach the caller.
  let outcome;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/recovery`,
    });
    outcome = classifyRecoveryResult(error as { status?: number; code?: string } | null);
  } catch {
    outcome = RECOVERY_UNREACHABLE_OUTCOME;
  }
  if (outcome.withheldCode) {
    console.warn("[auth] password recovery email not sent by provider", { code: outcome.withheldCode });
  } else if (!outcome.body.ok) {
    console.warn("[auth] password recovery refused", { code: outcome.body.code });
  }
  return NextResponse.json(outcome.body, { status: outcome.status });
}
