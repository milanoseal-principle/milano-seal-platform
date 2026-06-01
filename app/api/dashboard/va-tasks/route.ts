import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { generateVATasks } from "@/lib/vaTasks";
import { computeMatterIntelligence } from "@/lib/matterIntelligence";
import { toSlug } from "@/lib/executionReadiness";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest) {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch open deals that need attention.
    // Projection is intentionally minimal — excluded fields:
    // revenue, margin, client email/phone, operator_notes, internal_notes,
    // shipping_cost, label_url, storage_path, base_cost, service_role keys.
    const { data: deals, error } = await supabase
      .from("deals")
      .select(
        "id, matter_status, payment_status, destination_country, document_type, is_paid_and_released"
      )
      .not("matter_status", "in", '("completed","closed","delivered")')
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Graceful degradation — return empty task list, not 500
      return NextResponse.json({ tasks: [], total: 0, generated_from: 0 });
    }

    const allTasks = [];

    for (const deal of deals ?? []) {
      const countryId = toSlug(deal.destination_country ?? "");
      const documentId = toSlug(deal.document_type ?? "");

      if (!countryId || !documentId) continue;

      // Get matter intelligence (advisory — never block on failure)
      let intelligence = null;
      try {
        intelligence = computeMatterIntelligence({
          country_id: countryId,
          document_id: documentId,
          matter_type: "general",
          is_paid:
            deal.payment_status === "paid" ||
            deal.payment_status === "confirmed",
          deal_status: deal.matter_status,
        });
      } catch {
        // Skip intelligence overlay for this deal
      }

      const tasks = generateVATasks({
        matter_id: deal.id,
        country_id: countryId,
        document_id: documentId,
        deal_status: deal.matter_status,
        payment_status: deal.payment_status,
        is_notarized: false,
        has_apostille: false,
        has_translation: false,
        courier_status: null,
        missing_items: intelligence?.missing_items ?? [],
        authority_confidence: intelligence?.authority_confidence ?? null,
        chain_certification_status:
          intelligence?.authority_chain?.status ?? null,
        requires_qa_checklist: intelligence?.requires_qa_checklist ?? false,
      });

      allTasks.push(...tasks);
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      NORMAL: 2,
      LOW: 3,
    };
    allTasks.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
    );

    return NextResponse.json({
      tasks: allTasks,
      total: allTasks.length,
      generated_from: (deals ?? []).length,
    });
  } catch {
    return NextResponse.json({ tasks: [], total: 0, generated_from: 0 });
  }
}
