export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("operational_ledger")
    .select("id, event_type, deal_id, created_at, metadata")
    .or("event_type.ilike.%reject%,event_type.ilike.%block%,event_type.ilike.%fail%")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    // operational_ledger may not exist — return empty
    return NextResponse.json({ events: [], warning: error.message });
  }

  // Enrich with deal destination_country + document_type
  const dealIds = [...new Set((data ?? []).map((r) => r.deal_id).filter(Boolean))];

  let dealMap: Record<string, { destination_country: string; document_type: string }> = {};
  if (dealIds.length > 0) {
    const { data: deals } = await admin
      .from("deals")
      .select("id, destination_country, document_type")
      .in("id", dealIds as string[]);
    for (const d of deals ?? []) {
      dealMap[d.id] = { destination_country: d.destination_country, document_type: d.document_type };
    }
  }

  const events = (data ?? []).map((r) => ({
    id: r.id,
    event_type: r.event_type,
    deal_id: r.deal_id,
    destination_country: dealMap[r.deal_id as string]?.destination_country ?? null,
    document_type: dealMap[r.deal_id as string]?.document_type ?? null,
    created_at: r.created_at,
    metadata: r.metadata,
  }));

  return NextResponse.json({ events });
}
