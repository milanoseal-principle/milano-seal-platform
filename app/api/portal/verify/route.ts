import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();
    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: deal } = await supabase
      .from("deals")
      .select("id, email, client_name")
      .eq("access_token", token)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Invalid portal link" }, { status: 404 });
    }

    const dealEmail = (deal.email || "").toLowerCase().trim();
    const inputEmail = String(email).toLowerCase().trim();
    if (!dealEmail || dealEmail !== inputEmail) {
      return NextResponse.json(
        { error: "Email does not match our records for this matter" },
        { status: 403 },
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "Verification email is temporarily unavailable" },
        { status: 503 },
      );
    }

    const otp = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
    const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: otpError } = await supabase.from("portal_otps").upsert(
      { deal_id: deal.id, email: inputEmail, otp, expires_at, used: false },
      { onConflict: "deal_id" },
    );
    if (otpError) {
      return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }

    const provider = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Milano Seal <noreply@themilanoseal.com>",
        to: [inputEmail],
        subject: `Your Milano Seal™ Portal Access Code: ${otp}`,
        html: `
          <div style="background:#0A0A0A;padding:40px;font-family:Arial,sans-serif;color:#B0B0B0;max-width:480px;margin:0 auto">
            <p style="color:#C6A55A;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:24px">The Milano Seal™</p>
            <h2 style="color:#ffffff;font-size:22px;margin-bottom:16px">Your Portal Access Code</h2>
            <p style="margin-bottom:24px">Use this code to access your secure Matter portal.</p>
            <div style="background:#111111;border:1px solid #2A2A2A;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:36px;font-weight:700;color:#C6A55A;letter-spacing:8px">${otp}</span>
            </div>
            <p style="font-size:12px;color:#8A8A8A">This code expires in 15 minutes. Do not share it with anyone.</p>
          </div>
        `,
      }),
    });

    if (!provider.ok) {
      await supabase.from("portal_otps").delete().eq("deal_id", deal.id).eq("otp", otp);
      return NextResponse.json(
        { error: "Verification email could not be accepted by the provider" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email accepted for delivery",
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
