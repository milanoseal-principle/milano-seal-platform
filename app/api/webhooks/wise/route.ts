import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWiseSignature } from "@/lib/wise";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// Wise payment webhooks: https://docs.wise.com/api-docs/features/webhooks-notifications
// Secured via RSA signature on X-Signature-SHA256 header (Wise production public key).
// Idempotency via SHA-256 of event_id + resource_id + event_type.

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature-SHA256");

    const valid = await verifyWiseSignature(rawBody, signature);
    if (!valid) {
      console.warn("[wise-webhook] invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = String(payload.event_type ?? payload.type ?? "");
    const eventId = String(payload.data?.id ?? payload.event_id ?? payload.id ?? "");
    const resource = (payload.data?.resource ?? payload.resource ?? {}) as Record<string, unknown>;
    const resourceId = String(resource.id ?? resource.profileId ?? "");

    if (!eventType) {
      return NextResponse.json({ received: true, skipped: true });
    }

    const idempotencyHash = createHash("sha256")
      .update(`${eventId}:${resourceId}:${eventType}`)
      .digest("hex");

    const supabase = createAdminClient();

    // Idempotency check
    const { data: existing } = await supabase
      .from("wise_webhook_events")
      .select("id")
      .eq("idempotency_hash", idempotencyHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Store the event first
    await supabase.from("wise_webhook_events").insert({
      event_type: eventType,
      event_id: eventId || null,
      resource_id: resourceId || null,
      raw_event: payload,
      idempotency_hash: idempotencyHash,
    });

    // Only act on payment-confirmed events
    const isPaymentConfirmed =
      eventType === "transfers#state-change" &&
      (resource.currentState === "outgoing_payment_sent" ||
        resource.currentState === "funds_converted" ||
        resource.status === "COMPLETED") ||
      eventType === "balances#credit" ||
      eventType === "payments#paid";

    if (!isPaymentConfirmed) {
      return NextResponse.json({ received: true, event_type: eventType, acted: false });
    }

    // Extract reference — operator sets deal_id as reference when creating Wise payment request
    const reference = String(
      resource.reference ?? resource.details?.reference ?? payload.reference ?? ""
    ).trim();

    if (!reference) {
      return NextResponse.json({ received: true, acted: false, reason: "no_reference" });
    }

    // Find deal by deal_id or id using the reference
    const { data: deal } = await supabase
      .from("deals")
      .select("id, deal_id, payment_status, amount_due, amount_paid")
      .or(`deal_id.eq.${reference},id.eq.${reference}`)
      .maybeSingle();

    if (!deal) {
      console.warn(`[wise-webhook] no deal found for reference: ${reference}`);
      return NextResponse.json({ received: true, acted: false, reason: "deal_not_found" });
    }

    if (deal.payment_status === "paid") {
      return NextResponse.json({ received: true, acted: false, reason: "already_paid" });
    }

    const amountValue = resource.amount ?? resource.sourceAmount ?? payload.amount;
    const amountReceived =
      typeof amountValue === "number"
        ? amountValue
        : typeof amountValue === "object" && amountValue !== null
          ? Number((amountValue as Record<string, unknown>).value ?? 0)
          : 0;

    await supabase
      .from("deals")
      .update({
        payment_status: "paid",
        payment_method: "wise",
        payment_reference: eventId || reference,
        payment_amount_received: amountReceived || deal.amount_due || null,
        invoice_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", deal.id);

    // Record payment in payments table
    await supabase.from("payments").insert({
      deal_id: deal.id,
      payment_status: "payment_confirmed",
      payment_confirmed: true,
      amount: amountReceived || deal.amount_due || 0,
      currency: "USD",
      method: "wise",
      wise_event_id: eventId || null,
      wise_reference: reference,
      raw_event: payload,
    }).select().single().catch(() => null); // non-fatal if payments table shape differs

    return NextResponse.json({
      received: true,
      acted: true,
      deal_id: deal.deal_id ?? deal.id,
      event_type: eventType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[wise-webhook] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
