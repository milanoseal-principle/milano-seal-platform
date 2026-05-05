import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listWisePaymentRequests,
  getWiseBaseUrl,
  getWiseMode,
} from "@/lib/wise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Combined admin view: every "wise"-method deal joined to whatever Wise (sandbox
// or production) currently reports for the matching reference. This is what the
// /dashboard/admin/payments screen consumes.

export async function GET() {
  const mode = getWiseMode();
  const apiHost = getWiseBaseUrl();

  const supabase = createAdminClient();
  const { data: deals, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, mode, api_host: apiHost, error: error.message, items: [] },
      { status: 500 },
    );
  }

  const wise = await listWisePaymentRequests();
  const wiseByRef = new Map<string, (typeof wise.items)[number]>();
  for (const r of wise.items) {
    if (r.reference) {
      // Wise truncates reference at 20 chars, so DB deal_id may be longer; keep
      // the most recent one per reference key.
      wiseByRef.set(r.reference, r);
    }
  }

  const rows = (deals ?? []) as Record<string, unknown>[];
  const items = rows.map((d) => {
    const ref = String(d.deal_id ?? "").slice(0, 20);
    const live = wiseByRef.get(ref) ?? null;
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

  return NextResponse.json({
    ok: true,
    mode,
    api_host: apiHost,
    wise_ok: wise.ok,
    wise_error: wise.error,
    wise_total: wise.items.length,
    fetched_at: new Date().toISOString(),
    items,
  });
}
