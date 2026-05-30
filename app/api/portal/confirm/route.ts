import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

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
    const { token, email, otp } = await req.json();
    if (!token || !email || !otp) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

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
      .select("id")
      .eq("access_token", token)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: record } = await supabase
      .from("portal_otps")
      .select("id, deal_id, email, otp, expires_at, used")
      .eq("deal_id", deal.id)
      .eq("email", normalizedEmail)
      .eq("used", false)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: "No active code found. Request a new one." },
        { status: 404 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Code expired. Request a new one." },
        { status: 410 }
      );
    }

    if (record.otp !== otp.toUpperCase().trim()) {
      return NextResponse.json({ error: "Invalid code" }, { status: 403 });
    }

    // Mark OTP used (single-use enforcement) and rotate by clearing the value
    await supabase
      .from("portal_otps")
      .update({ used: true, otp: null })
      .eq("id", record.id);

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
