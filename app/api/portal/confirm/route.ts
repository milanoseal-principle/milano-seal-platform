import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "crypto";
import { defaultRequestLimiterDeps } from "@/lib/security/publicRequestLimit";
import { parseAndLimitPortalRequest, limitPortalMatter } from "@/lib/security/portalAccessGuard";

export const dynamic = "force-dynamic";

/** Compare fixed-length mailed codes without leaking matching prefix timing. */
function matchesPortalOtp(expected: string, submitted: string): boolean {
  const a = Buffer.from(expected.trim().toUpperCase(), "utf8");
  const b = Buffer.from(submitted.trim().toUpperCase(), "utf8");
  return a.length === 6 && b.length === 6 && timingSafeEqual(a, b);
}

// SECURITY-06: Portal session is now HMAC-signed.
// Token structure: base64(payload).hex(hmac-sha256-sig)
// Requires PORTAL_SESSION_SECRET environment variable.
// Sessions expire after 24 hours.

function buildSession(
  dealId: string,
  email: string,
  secret: string
): string {
  const payload = JSON.stringify({
    deal_id: dealId,
    email,
    scope: "portal",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  });
  const encodedPayload = Buffer.from(payload).toString("base64");
  const sig = createHmac("sha256", secret).update(encodedPayload).digest("hex");
  return `${encodedPayload}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const limiter = await defaultRequestLimiterDeps();
    const guarded = await parseAndLimitPortalRequest(req, true, limiter);
    if (guarded.error) return guarded.error;
    const { token, email, otp } = guarded.body;

    const sessionSecret = process.env.PORTAL_SESSION_SECRET;
    if (!sessionSecret) {
      return NextResponse.json(
        { error: "Session service unavailable" },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id, email")
      .eq("access_token", token)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Unable to verify portal access" }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!deal.email || deal.email.toLowerCase().trim() !== normalizedEmail) {
      return NextResponse.json({ error: "Unable to verify portal access" }, { status: 403 });
    }

    // Consume the Matter-scoped attempt quota before checking any OTP.
    // Expired, missing and incorrect codes all count; a sixth attempt locks
    // the 15-minute window and invalidates the previously issued code.
    const attemptLimit = await limitPortalMatter(req, deal.id, "portal_code_attempt", limiter);
    if (attemptLimit) {
      if (attemptLimit.status === 429) {
        await supabase.from("portal_otps").update({ used: true }).eq("deal_id", deal.id).eq("used", false);
      }
      return attemptLimit;
    }

    const { data: record } = await supabase
      .from("portal_otps")
      .select("id, deal_id, email, otp, expires_at, used")
      .eq("deal_id", deal.id)
      .eq("email", normalizedEmail)
      .eq("used", false)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: "Unable to verify portal access" },
        { status: 403 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Unable to verify portal access" },
        { status: 403 }
      );
    }

    if (!matchesPortalOtp(record.otp, otp ?? "")) {
      return NextResponse.json({ error: "Unable to verify portal access" }, { status: 403 });
    }

    // Mark OTP used (single-use enforcement). otp is NOT NULL, so it is not cleared;
    // used=true plus the used=false lookup above makes the code single-use. Fail closed:
    // bind the write to the same code issuance so a resend cannot authorize an old code.
    const { data: consumed, error: consumeError } = await supabase
      .from("portal_otps")
      .update({ used: true })
      .eq("id", record.id)
      .eq("used", false)
      .eq("otp", record.otp)
      .eq("expires_at", record.expires_at)
      .gt("expires_at", new Date().toISOString())
      .select("id");
    if (consumeError || !consumed?.length) {
      return NextResponse.json({ error: "Verification failed" }, { status: 409 });
    }

    // Build HMAC-signed session token
    const session = buildSession(deal.id, normalizedEmail, sessionSecret);

    return NextResponse.json({ success: true, session });
  } catch (err: unknown) {
    const { logger } = await import("@/lib/logger");
    logger.error("api/portal/confirm", "Confirmation failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
