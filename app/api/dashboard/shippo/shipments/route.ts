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
      .select(
        `id, matter_id, carrier, tracking_number, tracking_url, courier_status,
         label_created_at, delivered_at, exception_at, returned_at,
         deals(id, client_name)`
      )
      .order("label_created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { shipments: [], notice: "Migration 015 required" },
        { status: 200 }
      );
    }

    // Never return label_url, shipping_cost, raw rates, or margin
    const shipments = (data ?? []).map((row) => ({
      id: row.id,
      matter_id: row.matter_id,
      carrier: row.carrier ?? null,
      tracking_number: row.tracking_number ?? null,
      tracking_url: row.tracking_url ?? null,
      courier_status: row.courier_status ?? "UNKNOWN",
      label_created_at: row.label_created_at ?? null,
      delivered_at: row.delivered_at ?? null,
      exception_at: row.exception_at ?? null,
      returned_at: row.returned_at ?? null,
      deals: row.deals
        ? { id: (row.deals as { id: string; client_name: string | null }).id, client_name: (row.deals as { id: string; client_name: string | null }).client_name }
        : null,
    }));

    return NextResponse.json({ shipments }, { status: 200 });
  } catch {
    return NextResponse.json(
      { shipments: [], notice: "Migration 015 required" },
      { status: 200 }
    );
  }
}
