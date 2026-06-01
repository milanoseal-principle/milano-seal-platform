import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matterId: string }> }
) {
  await requireDashboardAccess();
  const { matterId } = await params;
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("custody_ledger")
    .select("id, deal_id, event, actor_type, notes, created_at, stage_from, stage_to")
    .eq("deal_id", matterId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ events: [], error: "Failed to load custody events" }, { status: 500 });
  }

  // Never expose: actor_id, label_url, storage_path
  const events = (rows ?? []).map((e) => ({
    id: e.id,
    deal_id: e.deal_id,
    event: e.event,
    actor_type: e.actor_type ?? "system",
    notes: e.notes ? String(e.notes).slice(0, 80) : null,
    created_at: e.created_at,
    stage_from: e.stage_from ?? null,
    stage_to: e.stage_to ?? null,
  }));

  return NextResponse.json({ events });
}
