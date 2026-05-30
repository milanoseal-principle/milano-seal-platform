import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWisePaymentRequest, getWiseBaseUrl } from "@/lib/wise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Combined admin view: every "wise"-method deal joined to whatever Wise
// production currently reports for the matching reference. This is what the
// /dashboard/admin/payments screen consumes.

export async function GET() {
  const apiHost = getWiseBaseUrl();

  const supabase = createAdminClient();
  const { data: deals, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, api_host: apiHost, error: error.message, items: [] },
      { status: 500 },
    );
  }

  const rows = (deals ?? []) as Record<string, unknown>[];

  // Look up each deal's Wise payment request individually using the stored ID.
  // Wise has no list-all endpoint — only GET by ID.
  const wiseResults = await Promise.all(
    rows.map((d) => {
      const id = (d.wise_request_id as string | null) ?? null;
      return id ? getWisePaymentRequest(id) : Promise.resolve(null);
    }),
  );

  const items = rows.map((d, i) => {
    const live = wiseResults[i];
    return {
      deal_id: d.deal_id ?? null,
      client_name: d.client_name ?? null,
      email: d.email ?? null,
      country: d.country ?? null,
      total_price: d.total_price ?? null,
      retainer: d.invoice_retainer ?? null,
      payment_method: d.payment_method ?? null,
      db_payment_status: d.payment_status ?? null,
      db_balance_status: d.balance_payment_status ?? null,
      payment_link: d.payment_link ?? null,
      paid_amount: d.payment_amount_received ?? null,
      balance_paid_amount: d.balance_amount_received ?? null,
      balance_paid_at: d.balance_paid_at ?? null,
      failed_at: d.payment_failed_at ?? null,
      failure_reason: d.payment_failure_reason ?? null,
      deal_status: d.deal_status ?? null,
      created_at: d.created_at ?? null,
      wise: live
        ? {
            id: live.id,
            status: live.status,
            short_url: live.shortUrl,
            amount: live.amount,
            currency: live.currency,
            description: live.description,
            payer_name: live.payerName,
            payer_email: live.payerEmail,
            created_at: live.createdAt,
          }
        : null,
    };
  });

  const liveCount = items.filter((i) => i.wise !== null).length;
  const wiseAttempted = rows.filter((d) => d.wise_request_id).length;
  // If we attempted Wise lookups but got zero results, treat as API unavailable
  const wiseOk = wiseAttempted === 0 || liveCount > 0;
  const wiseError = !wiseOk ? "Wise API returned no results — service may be unavailable" : null;

  return NextResponse.json({
    ok: true,
    api_host: apiHost,
    wise_ok: wiseOk,
    wise_error: wiseError,
    wise_total: liveCount,
    fetched_at: new Date().toISOString(),
    items,
  });
}
