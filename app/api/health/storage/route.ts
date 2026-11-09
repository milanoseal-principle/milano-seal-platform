import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireDashboardAccess(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } }); }
  const t0 = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return NextResponse.json({
      status: "ok",
      service: "storage",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "storage",
        error: "DEPENDENCY_OBSERVATION_UNAVAILABLE",
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
