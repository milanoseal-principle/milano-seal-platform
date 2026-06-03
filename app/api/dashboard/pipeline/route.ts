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
  scheduled: "SCHEDULE",
  in_execution: "EXECUTION",
  executed: "EXECUTION",
  apostille: "APOSTILLE",
  apostille_processing: "APOSTILLE",
  shipped: "DELIVERY",
  courier_ready: "DELIVERY",
  delivered: "COMPLETE",
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

import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

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
  const { data: rows, error } = await supabase
    .from("deals")
    .select("deal_status, payment_status, updated_at, due_at")
    .order("created_at", { ascending: false });

  if (error || !rows) {
    return NextResponse.json({ error: "Failed to load pipeline" }, { status: 500 });
  }

  const intake = rows.filter((d) => d.deal_status === "new").length;
  const review = rows.filter((d) => d.deal_status === "reviewing").length;
  const awaiting_payment = rows.filter((d) => d.deal_status === "awaiting_payment").length;
  const scheduled = rows.filter((d) => d.deal_status === "scheduled").length;
  const execution = rows.filter((d) => d.deal_status === "in_execution").length;
  const apostille = rows.filter((d) => d.deal_status === "apostille_processing" || d.deal_status === "apostille").length;
  const transit = rows.filter((d) => d.deal_status === "in_transit").length;
  const delivered = rows.filter((d) => d.deal_status === "delivered").length;
  const completed = rows.filter((d) => d.deal_status === "completed" || d.deal_status === "closed_won").length;

  return NextResponse.json({
    intake,
    review,
    awaiting_payment,
    scheduled,
    execution,
    apostille,
    transit,
    delivered,
    completed,
  });
}
