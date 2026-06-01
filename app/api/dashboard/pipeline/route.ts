import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

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
