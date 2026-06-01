import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  // Try custody_ledger first, fall back to activity_logs
  let events: {
    id: string;
    event_type: string;
    deal_id: string | null;
    document_type: string | null;
    destination_country: string | null;
    created_at: string;
  }[] = [];

  const { data: custodyRows, error: custodyError } = await supabase
    .from("custody_ledger")
    .select("id, event, deal_id, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!custodyError && custodyRows && custodyRows.length > 0) {
    // Fetch deal context for each event
    const dealIds = [...new Set(custodyRows.map((r) => r.deal_id).filter(Boolean))];
    let dealMap: Record<string, { document_type: string; destination_country: string }> = {};

    if (dealIds.length > 0) {
      const { data: dealRows } = await supabase
        .from("deals")
        .select("id, document_type, destination_country")
        .in("id", dealIds as string[]);
      for (const d of dealRows ?? []) {
        dealMap[d.id] = { document_type: d.document_type, destination_country: d.destination_country };
      }
    }

    events = custodyRows.map((r) => ({
      id: r.id,
      event_type: r.event ?? "update",
      deal_id: r.deal_id ?? null,
      document_type: r.deal_id ? (dealMap[r.deal_id]?.document_type ?? null) : null,
      destination_country: r.deal_id ? (dealMap[r.deal_id]?.destination_country ?? null) : null,
      created_at: r.created_at,
    }));
  } else {
    // Fall back to activity_logs
    const { data: actRows } = await supabase
      .from("activity_logs")
      .select("id, action, deal_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const dealIds = [...new Set((actRows ?? []).map((r) => r.deal_id).filter(Boolean))];
    let dealMap: Record<string, { document_type: string; destination_country: string }> = {};

    if (dealIds.length > 0) {
      const { data: dealRows } = await supabase
        .from("deals")
        .select("id, document_type, destination_country")
        .in("id", dealIds as string[]);
      for (const d of dealRows ?? []) {
        dealMap[d.id] = { document_type: d.document_type, destination_country: d.destination_country };
      }
    }

    events = (actRows ?? []).map((r) => ({
      id: r.id,
      event_type: r.action ?? "update",
      deal_id: r.deal_id ?? null,
      document_type: r.deal_id ? (dealMap[r.deal_id]?.document_type ?? null) : null,
      destination_country: r.deal_id ? (dealMap[r.deal_id]?.destination_country ?? null) : null,
      created_at: r.created_at,
    }));
  }

  return NextResponse.json({ events });
}
