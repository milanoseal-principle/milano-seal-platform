import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { mapProviderEvent, RESEND_NOTIFICATION_TAG, verifySvixSignature } from "@/lib/notifications/deliveryTruth";

export const runtime = "nodejs";

const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

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
  const { data: row,error:lookupError } = await admin.from("notifications").select("id, provider_event_id, delivery_status").eq("provider_message_id", messageId).maybeSingle();
  const retryCorrelation = () => NextResponse.json(
    { ok: false, code: "DELIVERY_TARGET_NOT_READY_RETRY" },
    { status: 503, headers: { "Retry-After": "60" } },
  );
  if (lookupError) return retryCorrelation();

  const evidence = {
    ...update,
    provider_event_id: id,
    delivery_evidence_ref: `resend:${id}`,
    last_provider_event_at: at,
  };
  if (!row) {
    const key = process.env.RESEND_API_KEY;
    if (!key || !UUID.test(messageId)) return retryCorrelation();

    // The webhook supplies a signed message ID. Authenticated retrieval ties it
    // to the durable notification row, without replaying the send.
    const result = await new Resend(key).emails.get(messageId);
    const email = result.data;
    if (result.error || email?.id !== messageId || !Array.isArray(email.tags) || !Array.isArray(email.to)) {
      return retryCorrelation();
    }
    const tags = email.tags.filter((tag) => tag.name === RESEND_NOTIFICATION_TAG);
    const notificationId = tags[0]?.value;
    if (tags.length !== 1 || !notificationId || !UUID.test(notificationId) || email.to.length !== 1) {
      return retryCorrelation();
    }
    const recipient = typeof email.to[0] === "string" ? email.to[0].trim().toLowerCase() : "";
    if (!recipient) return retryCorrelation();

    const recovered = await admin.from("notifications").update({
      ...evidence,
      provider_message_id: messageId,
      send_claim: null,
      status: "sent",
    }).eq("provider", "resend").eq("id", notificationId).not("send_claim", "is", null).eq("recipient_email", recipient)
      .is("provider_message_id", null).in("delivery_status", ["pending", "unknown"])
      .select("id").maybeSingle();
    if (recovered.error || !recovered.data) return retryCorrelation();
    return NextResponse.json({ ok: true, delivery_status: update.delivery_status });
  }
  if (row.provider_event_id === id) return NextResponse.json({ ok: true, duplicate: true });

  const { error } = await admin.from("notifications").update(evidence).eq("id", row.id);
  if (error?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  // Terminal states are immutable; a later contradictory event is acknowledged, not applied.
  if(error?.message==='NOTIFICATION_TERMINAL_STATE_IMMUTABLE')return NextResponse.json({ok:true,rejected:'TERMINAL'});
  if(error)return NextResponse.json({ok:false,code:'DELIVERY_RECORD_NOT_CONFIRMED'},{status:503});
  return NextResponse.json({ ok: true, delivery_status: update.delivery_status });
}
