import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data: matterRows } = await supabase
    .from("deals")
    .select("id, deal_status, payment_status, destination_country, document_type, updated_at")
    .not("deal_status", "in", "(completed,closed,new)")
    .order("updated_at", { ascending: false })
    .limit(1);

  const matter = matterRows?.[0] ?? null;

  if (!matter) {
    return NextResponse.json({ matter: null, events: [] });
  }

  const { data: eventRows } = await supabase
    .from("custody_ledger")
    .select("id, event, actor_type, created_at, status")
    .eq("deal_id", matter.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    matter,
    events: eventRows ?? [],
  });
}
