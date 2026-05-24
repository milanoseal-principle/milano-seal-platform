import { NextResponse } from "next/server";

// Stub: webhook system health
// Returns degraded until webhook processing infrastructure is confirmed active.
export async function GET() {
  return NextResponse.json({
    status: "stub",
    service: "webhooks",
    note: "Webhook processing stubs active. Handler wiring pending.",
    timestamp: new Date().toISOString(),
  });
}
