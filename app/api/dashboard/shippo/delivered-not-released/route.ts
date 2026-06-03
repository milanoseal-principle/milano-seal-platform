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
        `id, matter_id, carrier, tracking_number, courier_status, delivered_at,
         deals!inner(id, client_name, destination_country, document_type, paid_and_released)`
      )
      .eq("courier_status", "DELIVERED")
      .neq("deals.paid_and_released", true)
      .order("delivered_at", { ascending: false })
      .limit(100);

    if (error) {
      // Table may not exist yet (migration 015 pending)
      return NextResponse.json(
        { shipments: [], notice: "Migration 015 required" },
        { status: 200 }
      );
    }

    const shipments = (data ?? []).map((row) => {
      const deal = Array.isArray(row.deals) ? row.deals[0] : row.deals;
      // Sanitize tracking number for display — show last 4 chars masked
      const tn: string = row.tracking_number ?? "";
      const display =
        tn.length > 4
          ? `****${tn.slice(-4)}`
          : tn || "—";

      return {
        matter_id: row.matter_id ?? row.id,
        client_name: deal?.client_name ?? "—",
        country: deal?.destination_country ?? "—",
        document_type: deal?.document_type ?? "—",
        carrier: row.carrier ?? "—",
        tracking_number_display: display,
        delivered_at: row.delivered_at ?? null,
        certificate_status: "pending",
      };
    });

    return NextResponse.json({ shipments }, { status: 200 });
  } catch {
    return NextResponse.json(
      { shipments: [], notice: "Migration 015 required" },
      { status: 200 }
    );
  }
}
