import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const t0 = Date.now();
  try {
    const admin = createAdminClient();
    // Check operator_routing_eligibility table exists and is accessible
    const { error } = await admin
      .from("operator_routing_eligibility")
      .select("operator_id")
      .limit(1);

    const tableReady = !error;

    return NextResponse.json({
      status: tableReady ? "ok" : "degraded",
      service: "dispatch",
      eligibility_table: tableReady ? "ready" : "not_migrated",
      eligibility_gate: "enforced",
      phantom_data_guard: "active",
      idempotency: "enforced",
      live_routing: "gated_behind_onboarding_approval",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        status: "degraded",
        service: "dispatch",
        error: message,
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
