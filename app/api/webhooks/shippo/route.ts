import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapShippoTrackingStatus, toCustodyLedgerEvent } from "@/lib/shippo/status";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// Shippo tracking webhooks arrive when tracking status changes.
// Registered via POST /tracks with carrier + tracking_number.
// Secured via shared secret in query string: ?secret=SHIPPO_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SHIPPO_WEBHOOK_SECRET;
    if (secret) {
      const qs = req.nextUrl.searchParams.get("secret");
      if (qs !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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
      return NextResponse.json({ received: true, skipped: true });
    }

    const eventHash = createHash("sha256")
      .update(`${carrier}:${tracking_number}:${status}:${status_date}:${status_details}`)
      .digest("hex");

    const supabase = createAdminClient();

    // Idempotency check
    const { data: existing } = await supabase
      .from("shippo_tracking_events")
      .select("id")
      .eq("event_hash", eventHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Find the related shipment
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

    // DELIVERED: do not auto-complete — release gates must pass independently
    // EXCEPTION / RETURNED: these are surfaced to the operator, not hidden

    return NextResponse.json({
      received: true,
      matter_id,
      courier_status: mappedStatus,
      custody_event: toCustodyLedgerEvent(mappedStatus),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Shippo webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
