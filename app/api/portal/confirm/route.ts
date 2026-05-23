import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, email, otp } = await req.json();
    if (!token || !email || !otp) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id")
      .eq("access_token", token)
      .single();

    if (!deal)
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });

    const { data: record } = await supabase
      .from("portal_otps")
      .select("*")
      .eq("deal_id", deal.id)
      .eq("email", email.toLowerCase().trim())
      .eq("used", false)
      .single();

    if (!record)
      return NextResponse.json(
        { error: "No active code found. Request a new one." },
        { status: 404 }
      );

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Code expired. Request a new one." },
        { status: 410 }
      );
    }

    if (record.otp !== otp.toUpperCase().trim()) {
      return NextResponse.json({ error: "Invalid code" }, { status: 403 });
    }

    // Mark OTP as used (prevents replay — single-use enforcement)
    await supabase
      .from("portal_otps")
      .update({ used: true })
      .eq("id", record.id);

    // TODO SECURITY-06: portal OTP rotation and hashing
    // TODO SECURITY-06: replace base64 session with HMAC-signed JWT so
    //   session tokens cannot be forged by base64-encoding arbitrary deal_ids.

    // SECURITY-05: include email in session so resource guards can verify
    // the actor identity without re-querying the DB on every request.
    const normalizedEmail = email.toLowerCase().trim();
    const session = Buffer.from(
      JSON.stringify({ deal_id: deal.id, email: normalizedEmail, ts: Date.now() })
    ).toString("base64");

    return NextResponse.json({ success: true, session });
  } catch {
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
