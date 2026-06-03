import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("deals")
    .select(
      "id,deal_status,payment_status,destination_country,document_type,total_price,updated_at,created_at,apostille_at"
    );

  const deals = rows ?? [];
  const now = Date.now();

  // Payment Pending > 24h
  const paymentPending24h = deals.filter((d) => {
    if (d.payment_status !== "pending" && d.deal_status !== "awaiting_payment") return false;
    const created = new Date(d.created_at).getTime();
    return now - created > 24 * 60 * 60 * 1000;
  }).length;

  // Missing Compliance Data
  const missingCompliance = deals.filter(
    (d) =>
      !d.destination_country ||
      d.destination_country.trim() === "" ||
      !d.document_type ||
      d.document_type.trim() === ""
  ).length;

  // Apostille Delay Risk (in apostille > 7 days)
  const apostilleDelay = deals.filter((d) => {
    if (d.deal_status !== "apostille" && d.deal_status !== "apostille_processing") return false;
    if (!d.apostille_at) {
      // fallback: check updated_at
      const updated = new Date(d.updated_at).getTime();
      return now - updated > 7 * 24 * 60 * 60 * 1000;
    }
    const ap = new Date(d.apostille_at).getTime();
    return now - ap > 7 * 24 * 60 * 60 * 1000;
  }).length;

  // High Value > $1,500
  const highValue = deals.filter((d) => (d.total_price ?? 0) > 1500).length;

  // Follow-up Required (not updated in 72h, open matters)
  const openStatuses = new Set(["new", "reviewing", "under_review", "quoted", "awaiting_payment", "scheduled", "intake_received"]);
  const followUpRequired = deals.filter((d) => {
    if (!openStatuses.has(d.deal_status)) return false;
    const updated = new Date(d.updated_at).getTime();
    return now - updated > 72 * 60 * 60 * 1000;
  }).length;

  return NextResponse.json([
    { label: "Payment Pending > 24h", count: paymentPending24h, severity: "critical" },
    { label: "Missing Compliance Data", count: missingCompliance, severity: "warning" },
    { label: "Apostille Delay Risk", count: apostilleDelay, severity: "warning" },
    { label: "High Value Deal > $1,500", count: highValue, severity: "info" },
    { label: "Follow-up Required", count: followUpRequired, severity: "warning" },
  ]);
}
