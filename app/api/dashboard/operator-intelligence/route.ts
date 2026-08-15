import { NextResponse } from "next/server";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadOperatorIntelligence } from "@/lib/operator-intelligence/read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireDashboardAccess();

  try {
    const snapshot = await loadOperatorIntelligence();

    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[operator-intelligence] canonical read failed:", error);

    return NextResponse.json(
      {
        error: "OPERATOR_INTELLIGENCE_UNAVAILABLE",
        message:
          "Canonical Matter intelligence could not be read. Do not interpret this response as an empty action queue.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}
