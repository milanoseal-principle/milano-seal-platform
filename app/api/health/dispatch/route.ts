import { NextResponse } from "next/server";

// Stub: dispatch engine health
export async function GET() {
  return NextResponse.json({
    status: "stub",
    service: "dispatch",
    note: "Dispatch routing engine stubs active. Live routing pending.",
    timestamp: new Date().toISOString(),
  });
}
