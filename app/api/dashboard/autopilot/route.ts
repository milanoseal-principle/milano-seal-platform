import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAutopilotResult, AutopilotInput } from "@/lib/autopilot/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("deals")
    .select(
      "id, deal_status, payment_status, destination_country, document_type, witness_required, is_paid_and_released"
    )
    .in("deal_status", [
      "payment_confirmed",
      "scheduled",
      "in_execution",
      "apostille_processing",
      "delivered",
    ])
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matters = (rows ?? []).map((row) => {
    const input: AutopilotInput = {
      matter_id: row.id,
      matter_status: row.deal_status ?? null,
      payment_status: row.payment_status ?? null,
      destination_country: row.destination_country ?? null,
      document_type: row.document_type ?? null,
      witness_required: row.witness_required ?? false,
      ron_eligible: false,
      translation_required: false,
      apostille_required: false,
      consular_required: false,
      is_paid_and_released: row.is_paid_and_released ?? false,
    };
    return buildAutopilotResult(input);
  });

  const summary = {
    total_matters: matters.length,
    total_tasks: matters.reduce((sum, m) => sum + m.total_tasks, 0),
    total_pending: matters.reduce((sum, m) => sum + m.pending_confirmation.length, 0),
    total_blocked: matters.reduce((sum, m) => sum + m.blocked.length, 0),
  };

  return NextResponse.json({ matters, summary });
}
