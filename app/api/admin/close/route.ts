import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS } from "@/lib/twilio";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const runtime = "nodejs";

const CLOSE_MESSAGES: Record<string, (name: string, amount: number) => string> =
  {
    payment: (name, amount) =>
      `${name} — Nicholas Milano here. Your document matter with The Milano Seal™ is ready for execution. The retainer is $${Math.round(
        amount * 0.5
      )} to secure your date. Reply to proceed.`,
    reminder: (name, _) =>
      `${name} — following up on your Milano Seal matter. Your document is queued. Payment confirms your slot. Reply with any questions.`,
    final: (name, _) =>
      `${name} — final notice on your Milano Seal matter. Slot will be released today. Reply to proceed or this matter will be closed.`,
  };

export async function POST(req: NextRequest) {
  // Auth gate — founder_admin only
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      route: "/api/admin/close",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role !== "founder_admin") {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: user.email ?? user.id,
      route: "/api/admin/close",
      client_safe: false,
      metadata: { role: String(role), reason: "insufficient_role" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { deal_id, message_type = "payment" } = await req.json();
  if (!deal_id)
    return NextResponse.json({ error: "deal_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: deal } = await admin
    .from("deals")
    .select("*")
    .eq("deal_id", deal_id)
    .single();
  if (!deal)
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  if (!deal.phone)
    return NextResponse.json({ error: "No phone on deal" }, { status: 422 });

  const msgFn = CLOSE_MESSAGES[message_type] || CLOSE_MESSAGES.payment;
  const name = (deal.client_name || "").split(" ")[0] || "there";
  const message = msgFn(name, parseFloat(deal.amount) || 750);

  await sendSMS(deal.phone, message);
  return NextResponse.json({ ok: true, deal_id, message_type, message });
}
