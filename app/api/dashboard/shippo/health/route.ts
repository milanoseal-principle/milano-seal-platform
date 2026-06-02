import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("shippo_shipments")
      .select("courier_status, tracking_number, label_created_at");

    if (error) {
      return NextResponse.json({ no_data: true }, { status: 200 });
    }

    const rows = data ?? [];
    const count = (status: string) =>
      rows.filter((r) => r.courier_status === status).length;

    const labels_created = rows.filter(
      (r) => r.label_created_at != null
    ).length;
    const tracking_registered = rows.filter(
      (r) => r.tracking_number != null && r.tracking_number !== ""
    ).length;

    return NextResponse.json({
      labels_created,
      tracking_registered,
      in_transit_count: count("TRANSIT") + count("OUT_FOR_DELIVERY") + count("PRE_TRANSIT"),
      delivered_count: count("DELIVERED"),
      exception_count: count("EXCEPTION"),
      returned_count: count("RETURNED"),
      delivered_not_released_count: 0, // Requires join — use delivered-not-released route for accurate count
    });
  } catch {
    return NextResponse.json({ no_data: true }, { status: 200 });
  }
}
