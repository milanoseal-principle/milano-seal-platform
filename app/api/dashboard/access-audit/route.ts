import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  // Try security_events first (matches existing summary route), fall back to audit_logs
  let events: { id: string; event: string; actor: string | null; resource: string | null; created_at: string }[] = [];

  const { data: secRows } = await supabase
    .from("security_events")
    .select("id, event, actor, resource, created_at")
    .like("event", "resource.%")
    .order("created_at", { ascending: false })
    .limit(50);

  if (secRows && secRows.length > 0) {
    events = secRows;
  } else {
    // Fall back to audit_logs
    const { data: auditRows } = await supabase
      .from("audit_logs")
      .select("id, event, actor, resource, created_at")
      .like("event", "resource.%")
      .order("created_at", { ascending: false })
      .limit(50);
    events = auditRows ?? [];
  }

  return NextResponse.json({ events });
}
