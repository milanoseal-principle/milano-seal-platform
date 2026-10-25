import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public deployment monitors need only liveness. Provider configuration and
// dependency diagnostics belong on authenticated operator health routes.
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "milano-seal-platform",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
