import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileObservedWisePayments } from "@/lib/wise/reconciliation";
import { notifyClient } from "@/lib/notifications/orchestrator";
import { sendPaymentClearedAlerts } from "@/lib/notifications/transactionalEmailAlerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

async function paymentRow(matterId: string) {
  const admin = createAdminClient();
  return admin
    .from("deals")
    .select("id,deal_id,email,amount_due,amount_paid,currency,payment_confirmed")
    .eq("id", matterId)
    .single();
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const startedAt = new Date().toISOString();
  const { data: run } = await admin
    .from("wise_reconciliation_runs")
    .insert({
      started_at: startedAt,
      environment: "production",
      status: "running",
      payments_checked: 0,
      mismatches_found: 0,
      notes: "Automatic Wise acquiring-payment reconciliation",
    })
    .select("id")
    .maybeSingle();

  try {
    const result = await reconcileObservedWisePayments();

    for (const reconciled of result.results.filter((item) => item.settlementConfirmed)) {
      const { data } = await paymentRow(reconciled.matterId);
      if (!data?.payment_confirmed) continue;
      await notifyClient(reconciled.matterId, "payment_confirmed");
      await sendPaymentClearedAlerts({
        matterId: reconciled.matterId,
        matterReference: data.deal_id ?? reconciled.reference,
        clientEmail: data.email ?? null,
        amountPaid: Number(data.amount_paid ?? 0) || Number(data.amount_due ?? 0),
        currency: data.currency ?? "USD",
      });
    }

    if (run?.id) {
      await admin
        .from("wise_reconciliation_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "completed",
          payments_checked: result.checked,
          mismatches_found: result.results.filter(
            (item) => item.providerStatus === "CANCELLED" || item.providerStatus === "REQUIRES_ATTENTION",
          ).length,
          notes: JSON.stringify({
            providerMatched: result.providerMatched,
            settlementConfirmed: result.settlementConfirmed,
          }),
        })
        .eq("id", run.id);
    }

    return NextResponse.json({
      ok: true,
      checked: result.checked,
      providerMatched: result.providerMatched,
      settlementConfirmed: result.settlementConfirmed,
    });
  } catch (error) {
    console.error("[wise-reconcile-cron] failed", error instanceof Error ? error.message : "unknown_error");
    if (run?.id) {
      await admin
        .from("wise_reconciliation_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          notes: error instanceof Error ? error.message.slice(0, 500) : "unknown_error",
        })
        .eq("id", run.id);
    }
    return NextResponse.json({ error: "Wise reconciliation failed" }, { status: 503 });
  }
}
