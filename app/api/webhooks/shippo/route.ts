import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapShippoTrackingStatus, toCustodyLedgerEvent } from "@/lib/shippo/status";
import { createHash, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

function safeSecretEqual(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Shippo tracking webhooks arrive when tracking status changes.
// Registered via POST /tracks with carrier + tracking_number.
// Current provider integration authenticates with a configured shared secret.
// Missing production secret is a server configuration failure, never an allow-all state.
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SHIPPO_WEBHOOK_SECRET?.trim();
    if (!secret) {
      console.error("[shippo-webhook] SHIPPO_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const querySecret = req.nextUrl.searchParams.get("secret");
    const headerSecret = req.headers.get("x-milano-webhook-secret");
    if (!safeSecretEqual(headerSecret ?? querySecret, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const carrier: string = payload?.carrier ?? payload?.data?.carrier ?? "";
    const tracking_number: string = payload?.tracking_number ?? payload?.data?.tracking_number ?? "";
    const tracking_status = payload?.tracking_status ?? payload?.data?.tracking_status ?? {};
    const status: string = tracking_status?.status ?? "";
    const substatus = tracking_status?.substatus ?? null;
    const status_details: string = tracking_status?.status_details ?? "";
    const status_date: string = tracking_status?.status_date ?? new Date().toISOString();
    const location = tracking_status?.location ?? {};

    if (!carrier || !tracking_number || !status) {
      return NextResponse.json({ received: true, skipped: true, reason: "missing_tracking_identity" });
    }

    const eventHash = createHash("sha256")
      .update(`${carrier}:${tracking_number}:${status}:${status_date}:${status_details}`)
      .digest("hex");

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("shippo_tracking_events")
      .select("id")
      .eq("event_hash", eventHash)
      .maybeSingle();

    if (existing) return NextResponse.json({ received: true, duplicate: true });

    const { data: shipment } = await supabase
      .from("shippo_shipments")
      .select("id, matter_id")
      .eq("tracking_number", tracking_number)
      .maybeSingle();

    const matter_id = shipment?.matter_id ?? null;
    const mappedStatus = mapShippoTrackingStatus(status, substatus?.code);

    await supabase.from("shippo_tracking_events").insert({
      matter_id,
      carrier,
      tracking_number,
      shippo_shipment_id: payload?.object_id ?? null,
      status: mappedStatus,
      substatus_code: substatus?.code ?? null,
      substatus_text: substatus?.text ?? null,
      action_required: substatus?.action_required ?? false,
      status_details,
      status_date,
      location,
      raw_event: tracking_status,
      event_hash: eventHash,
    });

    if (shipment?.id) {
      await supabase
        .from("shippo_shipments")
        .update({
          courier_status: mappedStatus,
          ...(mappedStatus === "DELIVERED" ? { delivered_at: status_date } : {}),
          ...(mappedStatus === "RETURNED" ? { returned_at: status_date } : {}),
          ...(mappedStatus === "EXCEPTION" ? { exception_at: status_date } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", shipment.id);
    }

    // DELIVERED never auto-completes or auto-releases the Matter.
    // EXCEPTION / RETURNED remain operator-visible evidence.
    return NextResponse.json({
      received: true,
      matter_id,
      courier_status: mappedStatus,
      custody_event: toCustodyLedgerEvent(mappedStatus),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Shippo webhook error:", message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
