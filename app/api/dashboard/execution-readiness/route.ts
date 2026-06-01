import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  computeExecutionReadiness,
  type MatterState,
} from "@/lib/executionReadiness";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await requireDashboardAccess();

  const { searchParams } = req.nextUrl;
  const countryId = searchParams.get("country");
  const documentId = searchParams.get("document");
  const matterId = searchParams.get("matter_id");

  if (!countryId || !documentId) {
    return NextResponse.json(
      { error: "country and document are required" },
      { status: 400 },
    );
  }

  let matter: MatterState | undefined;

  if (matterId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("deals")
      .select(
        "matter_status, payment_status, is_paid_and_released, client_name, destination_country, document_type",
      )
      .eq("id", matterId)
      .single();

    if (data) {
      matter = data as MatterState;
    }
  }

  const result = computeExecutionReadiness(countryId, documentId, matter);

  return NextResponse.json({ readiness: result });
}
