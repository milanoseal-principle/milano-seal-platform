import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        status: "degraded",
        service: "storage",
        error: message,
        latency_ms: Date.now() - t0,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
