import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { evaluateExecutionReadiness } from "@/lib/intelligence/executionReadiness";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matterId: string }> }
) {
  await requireDashboardAccess();
  const { matterId } = await params;
  const adminClient = createAdminClient();

  try {
    const result = await evaluateExecutionReadiness(matterId, adminClient);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to evaluate readiness" },
      { status: 500 }
    );
  }
}
