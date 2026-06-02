import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import { getShippoTrackingStatus } from "@/lib/shippo/client";
import { mapShippoTrackingStatus, toCustodyLedgerEvent } from "@/lib/shippo/status";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = roleFromEmail(user.email);
    if (role !== "operator" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { matter_id, carrier, tracking_number } = body;

    if (!carrier || !tracking_number) {
      return NextResponse.json({ error: "carrier and tracking_number required" }, { status: 400 });
    }

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const trackingData = await getShippoTrackingStatus(carrier, tracking_number);
    const currentStatus = trackingData.tracking_status;

    if (!currentStatus) {
      return NextResponse.json({ success: true, courier_status: "UNKNOWN", events: [] });
    }

    const mappedStatus = mapShippoTrackingStatus(
      currentStatus.status,
      currentStatus.substatus?.code
    );

    const eventHash = createHash("sha256")
      .update(`${carrier}:${tracking_number}:${currentStatus.status}:${currentStatus.status_date}:${currentStatus.status_details}`)
      .digest("hex");

    // Insert event if not duplicate
    const { data: existing } = await supabase
      .from("shippo_tracking_events")
      .select("id")
      .eq("event_hash", eventHash)
      .maybeSingle();

    if (!existing && matter_id) {
      await supabase.from("shippo_tracking_events").insert({
        matter_id,
        carrier,
        tracking_number,
        status: mappedStatus,
        substatus_code: currentStatus.substatus?.code ?? null,
        substatus_text: currentStatus.substatus?.text ?? null,
        action_required: currentStatus.substatus?.action_required ?? false,
        status_details: currentStatus.status_details,
        status_date: currentStatus.status_date,
        location: currentStatus.location ?? {},
        raw_event: currentStatus,
        event_hash: eventHash,
      });

      // Update courier_status on the shipment row
      await supabase
        .from("shippo_shipments")
        .update({ courier_status: mappedStatus, updated_at: new Date().toISOString() })
        .eq("matter_id", matter_id)
        .eq("tracking_number", tracking_number);
    }

    const sanitizedEvents = (trackingData.tracking_history ?? []).map((e) => ({
      status: mapShippoTrackingStatus(e.status, e.substatus?.code),
      status_details: e.status_details,
      status_date: e.status_date,
      city: e.location?.city ?? null,
      country: e.location?.country ?? null,
    }));

    return NextResponse.json({
      success: true,
      carrier,
      tracking_number_display: tracking_number,
      courier_status: mappedStatus,
      custody_event: toCustodyLedgerEvent(mappedStatus),
      last_update: currentStatus.status_date,
      events: sanitizedEvents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
