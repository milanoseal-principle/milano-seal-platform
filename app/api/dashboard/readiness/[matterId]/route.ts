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
    const { data: matter, error } = await adminClient
      .from("deals")
      .select(
        "id, deal_id, deal_status, payment_status, client_name, client_email, document_count, destination_country, receiving_authority, signing_type, ron_eligible, apostille_required, apostille_route"
      )
      .eq("id", matterId)
      .single();

    if (error || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const result = evaluateExecutionReadiness(matter as Record<string, unknown>);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to evaluate readiness" },
      { status: 500 }
    );
  }
}
