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
        "id, deal_id, deal_status, payment_status, client_name, email, document_count:docs_count, destination_country, apostille_required, customer_execution_preference, execution_truth"
      )
      .eq("id", matterId)
      .single();

    if (error || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // Derive readiness facts from canonical columns: execution_truth holds the operator-confirmed
    // method, review and governed authority route (no separate signing/route columns exist).
    const row = matter as Record<string, unknown>;
    const truth = (row.execution_truth ?? {}) as Record<string, unknown>;
    const packet = (truth.authority_packet ?? {}) as Record<string, unknown>;
    const method = (truth.execution_method as string | undefined) ?? (row.customer_execution_preference as string | undefined) ?? null;
    const result = evaluateExecutionReadiness({
      ...row,
      client_email: row.email ?? null,
      signing_type: method,
      ron_eligible: method === "ron" && Boolean(truth.review_confirmed_by),
      apostille_route: (packet.route_type as string | undefined) ?? null,
      receiving_authority: (truth.receiving_authority as string | undefined) ?? null,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to evaluate readiness" },
      { status: 500 }
    );
  }
}
