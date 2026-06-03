import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export interface PaymentReviewRow {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  matter_ref: string | null;
  tier: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  wise_reference: string | null;
  payment_confirmed_at: string | null;
  created_at: string | null;
  status: string | null;
}

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, deal_id, client_name, tier, amount_due, amount_paid, payment_status, payment_method, payment_reference, wise_reference, payment_confirmed_at, created_at, status"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Webhook events summary — graceful if table doesn't exist yet
  let webhookEvents: { event_type: string; processed: boolean; processing_error: string | null; received_at: string }[] = [];
  try {
    const { data: events } = await supabase
      .from("wise_webhook_events")
      .select("event_type, processed, processing_error, received_at")
      .order("received_at", { ascending: false })
      .limit(50);
    webhookEvents = events ?? [];
  } catch { /* migration 016 not yet applied */ }

  const rows: PaymentReviewRow[] = (data ?? []).map((d) => ({
    id: d.id,
    deal_id: d.deal_id ?? null,
    client_name: d.client_name ?? null,
    matter_ref: d.deal_id ?? null,
    tier: d.tier ?? null,
    amount_due: d.amount_due ?? null,
    amount_paid: d.amount_paid ?? null,
    payment_status: d.payment_status ?? null,
    payment_method: d.payment_method ?? null,
    payment_reference: d.payment_reference ?? null,
    wise_reference: d.wise_reference ?? null,
    payment_confirmed_at: d.payment_confirmed_at ?? null,
    created_at: d.created_at ?? null,
    status: d.status ?? null,
  }));

  return NextResponse.json({ payments: rows, webhook_events: webhookEvents });
}
