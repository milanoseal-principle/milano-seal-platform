import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProviderEvent, verifySvixSignature } from "@/lib/notifications/deliveryTruth";

export const runtime = "nodejs";

// POST /api/webhooks/resend — authenticated provider delivery evidence. Fails closed without a secret.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const id = request.headers.get("svix-id");
  const verified = verifySvixSignature({
    secret: process.env.RESEND_WEBHOOK_SECRET,
    id,
    timestamp: request.headers.get("svix-timestamp"),
    signatureHeader: request.headers.get("svix-signature"),
    body,
  });
  if (!verified || !id) return NextResponse.json({ ok: false, code: "UNVERIFIED_WEBHOOK" }, { status: 401 });

  let event: { type?: string; created_at?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false, code: "MALFORMED_WEBHOOK" }, { status: 400 });
  }
  const messageId = event.data?.email_id;
  const at = event.created_at && !Number.isNaN(Date.parse(event.created_at)) ? new Date(event.created_at).toISOString() : new Date().toISOString();
  const update = event.type ? mapProviderEvent(event.type, at) : null;
  if (!messageId || !update) return NextResponse.json({ ok: true, ignored: true });

  const admin = createAdminClient();
  const { data: row } = await admin.from("notifications").select("id, provider_event_id, delivery_status").eq("provider_message_id", messageId).maybeSingle();
  if (!row) return NextResponse.json({ ok: true, unmatched: true });
  if (row.provider_event_id === id) return NextResponse.json({ ok: true, duplicate: true });

  const { error } = await admin.from("notifications").update({
    ...update,
    provider_event_id: id,
    delivery_evidence_ref: `resend:${id}`,
    last_provider_event_at: at,
  }).eq("id", row.id);
  if (error?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  // Terminal states are immutable; a later contradictory event is acknowledged, not applied.
  if (error) return NextResponse.json({ ok: true, rejected: error.message === "NOTIFICATION_TERMINAL_STATE_IMMUTABLE" ? "TERMINAL" : "UPDATE_REJECTED" });
  return NextResponse.json({ ok: true, delivery_status: update.delivery_status });
}
