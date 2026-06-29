import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireDashboardAccess();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, document_type, destination_country, deal_status, payment_status, payment_confirmed, payment_confirmed_at, payment_settlement_status, payment_observed_at, payment_cleared_at, payment_funding_method, founder_payment_override_at, founder_payment_override_by, founder_payment_override_reason, amount_due, amount_paid, discount_type, service_fee_waived, tier, courier_tracking_id, courier_carrier, delivery_status, updated_at, created_at, due_at, balance_due, total_price"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  // viewer_role is server-resolved (never client-trusted). is_platform_fee_only is
  // computed from the real discount/fee columns, not a stored column.
  const is_platform_fee_only =
    data.discount_type === "platform_fee_only" || data.service_fee_waived === true;
  return NextResponse.json({ ...data, is_platform_fee_only, viewer_role: access.role });
}
