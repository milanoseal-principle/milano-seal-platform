import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function countByStatus(rows: { matter_status?: string | null; status?: string | null }[], status: string) {
  return rows.filter(
    (r) => r.matter_status === status || r.status === status
  ).length;
}

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Pipeline counts from deals
  let deals: { matter_status: string | null }[] = [];
  try {
    const { data } = await supabase
      .from("deals")
      .select("matter_status")
      .limit(5000);
    deals = data ?? [];
  } catch {
    deals = [];
  }

  const pipeline = {
    intake: countByStatus(deals, "intake_received"),
    review: countByStatus(deals, "under_review") + countByStatus(deals, "compliance_review"),
    awaiting_payment: countByStatus(deals, "awaiting_payment") + countByStatus(deals, "quoted"),
    scheduled: countByStatus(deals, "scheduled"),
    in_execution: countByStatus(deals, "in_execution"),
    apostille_processing: countByStatus(deals, "apostille_processing"),
    in_transit: countByStatus(deals, "shipped") + countByStatus(deals, "courier_ready"),
    delivered: countByStatus(deals, "delivered"),
    completed: countByStatus(deals, "completed") + countByStatus(deals, "closed"),
  };

  // Courier counts from shippo_shipments
  let courier = {
    label_created: 0,
    in_transit: 0,
    delivered: 0,
    exception: 0,
    returned: 0,
  };

  try {
    const { data } = await supabase
      .from("shippo_shipments")
      .select("courier_status")
      .limit(5000);

    if (data) {
      const countCourier = (status: string) =>
        data.filter((r) => r.courier_status === status).length;
      courier = {
        label_created: countCourier("LABEL_CREATED") + countCourier("PRE_TRANSIT"),
        in_transit: countCourier("TRANSIT") + countCourier("OUT_FOR_DELIVERY"),
        delivered: countCourier("DELIVERED"),
        exception: countCourier("EXCEPTION"),
        returned: countCourier("RETURNED"),
      };
    }
  } catch {
    // Migration 015 not applied — courier zeros are accurate
  }

  // Verified releases count
  let verified_releases = 0;
  try {
    const { count } = await supabase
      .from("verification_records")
      .select("*", { count: "exact", head: true })
      .eq("verified", true);
    verified_releases = count ?? 0;
  } catch {
    verified_releases = 0;
  }

  // Never return: client_name, email, phone, internal_notes, operator_notes, revenue, margin
  return NextResponse.json({
    pipeline,
    courier,
    verified_releases,
    last_updated: new Date().toISOString(),
  });
}
