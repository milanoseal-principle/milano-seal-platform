import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireDashboardAccess();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, document_type, destination_country, deal_status, payment_status, tier, courier_tracking_id, courier_carrier, delivery_status, updated_at, created_at, due_at, balance_due, total_price"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
