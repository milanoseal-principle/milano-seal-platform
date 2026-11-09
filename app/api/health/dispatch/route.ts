import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireDashboardAccess(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } }); }
  const t0 = Date.now();
  try {
    const admin = createAdminClient({ timeoutMs: 10_000 });
    // Check operator_routing_eligibility table exists and is accessible
    const { error } = await admin
      .from("operator_routing_eligibility")
      .select("operator_id")
      .limit(1);

    const tableReady = !error;

    return NextResponse.json({
      status: tableReady ? "ok" : "degraded",
      service: "dispatch",
      eligibility_table: tableReady ? "read_observed" : "NOT_VERIFIED",
      evidence: "routing_table_read_only",
      provider_health: "NOT_VERIFIED",
      live_routing: "gated_behind_onboarding_approval",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    }, { status: tableReady ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "dispatch",
        error: "DEPENDENCY_OBSERVATION_UNAVAILABLE",
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
