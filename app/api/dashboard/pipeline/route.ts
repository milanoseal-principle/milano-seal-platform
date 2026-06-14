import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAGE_MAP: Record<string, string> = {
  new: "INTAKE",
  intake_received: "INTAKE",
  under_review: "REVIEW",
  reviewing: "REVIEW",
  compliance_review: "REVIEW",
  quoted: "PRICING",
  awaiting_payment: "PAYMENT",
  payment_confirmed: "PAYMENT",
  payment_received: "PAYMENT",
  invoice_created: "PAYMENT",
  invoice_sent: "PAYMENT",
  payment_link_created: "PAYMENT",
  payment_confirmed_manual: "PAYMENT",
  scheduling_unlocked: "SCHEDULE",
  scheduled: "SCHEDULE",
  execution_scheduled: "SCHEDULE",
  in_execution: "EXECUTION",
  executed: "EXECUTION",
  ron_completed: "EXECUTION",
  apostille: "APOSTILLE",
  apostille_processing: "APOSTILLE",
  apostille_submitted: "APOSTILLE",
  apostille_completed: "APOSTILLE",
  courier_ready: "DELIVERY",
  courier_released: "DELIVERY",
  in_transit: "DELIVERY",
  shipped: "DELIVERY",
  delivered: "COMPLETE",
  delivery_confirmed: "COMPLETE",
  paid_and_released: "COMPLETE",
  completed: "COMPLETE",
  closed: "COMPLETE",
  closed_won: "COMPLETE",
};

const STAGES = [
  "INTAKE",
  "REVIEW",
  "PRICING",
  "PAYMENT",
  "SCHEDULE",
  "EXECUTION",
  "APOSTILLE",
  "DELIVERY",
  "COMPLETE",
];

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("deals")
    .select("deal_status");

  const counts: Record<string, number> = {};
  for (const stage of STAGES) counts[stage] = 0;

  for (const row of rows ?? []) {
    const stage = STAGE_MAP[row.deal_status] ?? "INTAKE";
    counts[stage] = (counts[stage] ?? 0) + 1;
  }

  return NextResponse.json({
    stages: STAGES.map((name) => ({ name, count: counts[name] ?? 0 })),
  });
}
