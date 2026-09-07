import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  evaluatePipelineStagnation,
  type StagnationSourceRow,
} from "@/lib/matter/pipelineStagnation";

export const dynamic = "force-dynamic";

// Operator-only Pipeline Stagnation Alerts.
// Pure read projection: selects canonical Matter rows and their existing stage
// timestamps, then evaluates stage-age deterministically. It mutates nothing and
// asserts no SLA. Non-operators receive 401.
export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, destination_country, document_type, status, deal_status, created_at, updated_at, scheduled_at, apostille_at, shipped_at",
    )
    .order("updated_at", { ascending: true })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = evaluatePipelineStagnation(
    (data ?? []) as StagnationSourceRow[],
    Date.now(),
  );

  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
