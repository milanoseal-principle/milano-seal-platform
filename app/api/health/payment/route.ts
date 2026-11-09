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
    // Verify payment-related table is accessible
    const { error } = await admin
      .from("deals")
      .select("id, payment_status")
      .eq("payment_status", "paid")
      .limit(1);
    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      service: "payment",
      evidence: "canonical_payment_table_read_only", provider_health: "NOT_VERIFIED",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "payment",
        error: "DEPENDENCY_OBSERVATION_UNAVAILABLE",
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
