import { normalizeServiceIntent, serviceIntentLabel } from "@/lib/intake/serviceIntent";
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
      "id, deal_id, client_name, internal_notes, execution_truth, document_type, destination_country, deal_status, payment_status, payment_confirmed, payment_confirmed_at, payment_settlement_status, payment_observed_at, payment_cleared_at, payment_funding_method, founder_payment_override_at, founder_payment_override_by, founder_payment_override_reason, amount_due, amount_paid, tier, courier_tracking_id, courier_carrier, delivery_status, updated_at, created_at, due_at, balance_due, total_price"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  // viewer_role is server-resolved (never client-trusted). is_platform_fee_only is
  // computed (zero-charge matter) — avoids selecting optional discount columns that
  // may be absent on the live DB.
  const is_platform_fee_only = Number(data.amount_due ?? 0) === 0;
  const { internal_notes, execution_truth, ...publicFields } = data;
  let requestedService: string | null = null;
  let customerContext: Record<string,string> = {};
  try {
    const metadata = JSON.parse(internal_notes ?? "null");
    const context=metadata?.customer_service_context;
    if(context && typeof context==='object') customerContext=Object.fromEntries(['witness_context','document_description','deadline','receiving_authority','requested_service_location'].filter(key=>typeof context[key]==='string').map(key=>[key,context[key].slice(0,12000)]));
    const value = context?.service_intent ?? metadata?.service_intent;
    if (typeof value === "string") requestedService = serviceIntentLabel(normalizeServiceIntent(value));
  } catch { /* Missing historical context remains unknown. */ }
  const truth = execution_truth && typeof execution_truth === "object" ? execution_truth as Record<string, unknown> : {};
  const method = truth.review_confirmed_at && truth.review_confirmed_by && typeof truth.execution_method === "string" && truth.execution_method !== "review_required" ? truth.execution_method : null;
  return NextResponse.json({ ...publicFields, requested_service: requestedService, customer_request_context:customerContext, confirmed_execution_route: method, is_platform_fee_only, viewer_role: access.role });
}
