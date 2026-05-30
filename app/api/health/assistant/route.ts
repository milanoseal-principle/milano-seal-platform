import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const t0 = Date.now();
  try {
    const admin = createAdminClient();
    // Check intake table accessibility
    const { error } = await admin
      .from("deals")
      .select("id")
      .limit(1);
    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      service: "assistant",
      parser: "intake_extractor_active",
      human_review_gate: "enforced",
      autonomous_quote: "blocked",
      autonomous_schedule: "blocked",
      latency_ms: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        status: "degraded",
        service: "assistant",
        error: message,
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
