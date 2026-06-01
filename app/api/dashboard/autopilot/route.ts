import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAutopilotResult } from "@/lib/autopilot/engine";
import { computeMatterIntelligence } from "@/lib/matterIntelligence";
import { toSlug } from "@/lib/executionReadiness";

export async function GET(_req: NextRequest) {
  try { await requireDashboardAccess(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch active matters that may have autopilot tasks
    const { data: deals } = await supabase
      .from("deals")
      .select("id, matter_status, payment_status, destination_country, document_type, is_paid_and_released")
      .not("matter_status", "in", '("new","intake_received","closed")')
      .order("updated_at", { ascending: false })
      .limit(30);

    const allResults = [];

    for (const deal of deals ?? []) {
      const countryId = toSlug(deal.destination_country ?? "");
      const documentId = toSlug(deal.document_type ?? "");
      if (!countryId || !documentId) continue;

      let intelligence = null;
      try {
        intelligence = computeMatterIntelligence({
          country_id: countryId,
          document_id: documentId,
          matter_type: "general",
          is_paid: deal.payment_status === "paid" || deal.payment_status === "confirmed",
          deal_status: deal.matter_status,
        });
      } catch { /* advisory — skip */ }

      const result = buildAutopilotResult({
        matter_id: deal.id,
        country_id: countryId,
        document_id: documentId,
        matter_status: deal.matter_status,
        payment_status: deal.payment_status,
        is_paid_and_released: deal.is_paid_and_released ?? false,
        is_notarized: false,
        has_apostille: false,
        has_translation: false,
        has_scheduled: ["scheduled", "in_execution", "apostille_processing", "courier_ready", "shipped", "delivered", "completed"].includes(deal.matter_status ?? ""),
        courier_status: null,
        requires_qa_checklist: intelligence?.requires_qa_checklist ?? false,
        ron_eligible: intelligence?.ron_available ?? false,
        witness_required: intelligence?.witnesses_required ?? false,
        translation_required: intelligence?.translation_required ?? false,
        apostille_required: intelligence?.apostille_required ?? false,
      });

      if (result.tasks.length > 0) allResults.push(result);
    }

    const totalTasks = allResults.reduce((sum, r) => sum + r.tasks.length, 0);
    const totalBlocked = allResults.reduce((sum, r) => sum + r.blocked_tasks.length, 0);
    const totalPending = allResults.reduce((sum, r) => sum + r.pending_confirmation.length, 0);

    return NextResponse.json({
      results: allResults,
      total_tasks: totalTasks,
      total_blocked: totalBlocked,
      total_pending: totalPending,
      matters_with_tasks: allResults.length,
    });
  } catch {
    return NextResponse.json({ results: [], total_tasks: 0, total_blocked: 0, total_pending: 0, matters_with_tasks: 0 });
  }
}
