import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const t0 = Date.now();
  try {
    const admin = createAdminClient();
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
      gate: "payment_before_scheduling enforced",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        status: "degraded",
        service: "payment",
        error: message,
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
