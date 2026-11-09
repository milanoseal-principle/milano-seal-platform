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
    // Check intake table accessibility
    const { error } = await admin
      .from("deals")
      .select("id")
      .limit(1);
    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      service: "assistant",
      evidence: "canonical_intake_table_read_only", assistant_runtime: "NOT_VERIFIED",
      human_review_gate: "enforced",
      autonomous_quote: "blocked",
      autonomous_schedule: "blocked",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "assistant",
        error: "DEPENDENCY_OBSERVATION_UNAVAILABLE",
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
