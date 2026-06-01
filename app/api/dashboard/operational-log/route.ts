import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  // Try custody_ledger first, fall back to activity_logs
  let events: { id: string; event: string; deal_id: string | null; actor_type: string | null; created_at: string }[] = [];

  const { data: custodyRows, error: custodyError } = await supabase
    .from("custody_ledger")
    .select("id, event, deal_id, actor_type, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!custodyError && custodyRows && custodyRows.length > 0) {
    events = custodyRows.map((r) => ({
      id: r.id,
      event: r.event,
      deal_id: r.deal_id ?? null,
      actor_type: r.actor_type ?? null,
      created_at: r.created_at,
    }));
  } else {
    // Fall back to activity_logs
    const { data: actRows } = await supabase
      .from("activity_logs")
      .select("id, action, deal_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    events = (actRows ?? []).map((r) => ({
      id: r.id,
      event: r.action,
      deal_id: r.deal_id ?? null,
      actor_type: "system",
      created_at: r.created_at,
    }));
  }

  return NextResponse.json({ events });
}
