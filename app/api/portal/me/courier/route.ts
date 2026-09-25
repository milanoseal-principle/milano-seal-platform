import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapShippoTrackingStatus } from "@/lib/shippo/status";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMatterShipmentLegs,
  publicShipmentLegProjection,
} from "@/lib/intelligence/execution-brain/authorityLogistics";

export const dynamic = "force-dynamic";

// Portal-safe courier endpoint. Never exposes: label_url, shipping cost,
// internal carrier account, full raw payload, or operator notes.

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const matter_id = req.nextUrl.searchParams.get("matter_id");
    if (!matter_id) return NextResponse.json({ error: "matter_id required" }, { status: 400 });

    // Verify portal access to this matter
    const { data: matter } = await supabase
      .from("deals")
      .select("id, email")
      .eq("id", matter_id)
      .eq("email", user.email)
      .maybeSingle();

    if (!matter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Matter-linked shipment legs, client-safe projection only (after the
    // portal access check above). Tracking numbers are shown for final legs.
    const legs = (await getMatterShipmentLegs(createAdminClient(), matter.id).catch(() => [])).map((leg) =>
      publicShipmentLegProjection(leg, {
        trackingApproved: leg.leg_type === "final_to_client" || leg.leg_type === "final_international",
      }),
    );

    const { data: shipment } = await supabase
      .from("shippo_shipments")
      .select("carrier, tracking_number, tracking_url, courier_status, label_created_at")
      .eq("matter_id", matter_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!shipment || !shipment.tracking_number) {
      return NextResponse.json({
        carrier: null,
        tracking_number_display: null,
        tracking_url: null,
        courier_status: null,
        last_update: null,
        events: [],
        legs,
        empty_message: "Tracking details will appear once courier activity is created.",
      });
    }

    const { data: events } = await supabase
      .from("shippo_tracking_events")
      .select("status, status_details, status_date, location")
      .eq("tracking_number", shipment.tracking_number)
      .order("status_date", { ascending: false })
      .limit(20);

    const sanitizedEvents = (events ?? []).map((e) => ({
      status: e.status,
      status_details: e.status_details,
      status_date: e.status_date,
      city: (e.location as Record<string, string>)?.city ?? null,
      country: (e.location as Record<string, string>)?.country ?? null,
    }));

    const lastUpdate = events?.[0]?.status_date ?? null;

    return NextResponse.json({
      carrier: shipment.carrier,
      tracking_number_display: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
      courier_status: shipment.courier_status,
      last_update: lastUpdate,
      events: sanitizedEvents,
      legs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
