import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWiseSignature, getWiseMode } from "@/lib/wise";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature-sha256");
  const mode = getWiseMode();

  const ok = await verifyWiseSignature(raw, sig);
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawDealId = extractDealId(event);
  if (!rawDealId) {
    return NextResponse.json({ received: true, skipped: "no deal_id" });
  }

  const isBalance = /-BAL$/i.test(rawDealId);
  const dealId = rawDealId.replace(/-BAL$/i, "");

  const settled = isPaymentSettled(event) || isPaymentFailed(event);
  if (!settled) {
    return NextResponse.json({
      received: true,
      deal_id: dealId,
      skipped: "not a settlement event",
    });
  }

  const failed = isPaymentFailed(event);
  const supabase = createAdminClient();

  if (isBalance) {
    const balanceUpdate: Record<string, unknown> = failed
      ? {
          balance_payment_status: "failed",
        }
      : {
          balance_payment_status: "paid",
          balance_amount_received: pickAmount(event),
          balance_paid_at: new Date().toISOString(),
        };

    const { data: deal, error } = await supabase
      .from("deals")
      .update(balanceUpdate)
      .eq("deal_id", dealId)
      .neq("balance_payment_status", "paid")
      .select()
      .maybeSingle();

    if (error) {
      console.error("[wise/webhook] balance update error:", error);
      return NextResponse.json(
        { error: "DB update failed", detail: error.message },
        { status: 500 },
      );
    }

    if (!deal) {
      return NextResponse.json({
        received: true,
        deal_id: dealId,
        skipped: "no matching pending balance",
      });
    }

    void logActivity({
      deal_id: dealId,
      actor: "wise-webhook",
      action: failed ? "payment_updated" : "payment_confirmed",
      detail: failed
        ? `Wise webhook (${mode}) — balance payment failed`
        : `Wise webhook (${mode}) confirmed balance payment`,
      meta: { event_type: pickEventType(event), leg: "balance" },
    });

    revalidatePath("/dashboard/deals");
    revalidatePath(`/dashboard/deals/${dealId}`);

    return NextResponse.json({
      received: true,
      deal_id: dealId,
      action: failed ? "balance_failed" : "balance_paid",
      mode,
    });
  }

  const primaryUpdate: Record<string, unknown> = failed
    ? {
        payment_status: "failed",
        payment_failed_at: new Date().toISOString(),
        payment_failure_reason: pickEventType(event) || "wise_failed",
      }
    : {
        payment_status: "paid",
        payment_method: "wise",
        payment_reference: pickRef(event) ?? dealId,
        payment_amount_received: pickAmount(event),
      };

  const query = supabase
    .from("deals")
    .update(primaryUpdate)
    .eq("deal_id", dealId);

  const { data: deal, error } = await (failed
    ? query.select().maybeSingle()
    : query.neq("payment_status", "paid").select().maybeSingle());

  if (error) {
    console.error("[wise/webhook] DB update error:", error);
    return NextResponse.json(
      { error: "DB update failed", detail: error.message },
      { status: 500 },
    );
  }

  if (!deal) {
    return NextResponse.json({
      received: true,
      deal_id: dealId,
      skipped: failed ? "no matching deal" : "no matching pending deal",
    });
  }

  void logActivity({
    deal_id: dealId,
    actor: "wise-webhook",
    action: failed ? "payment_updated" : "payment_confirmed",
    detail: failed
      ? `Wise webhook (${mode}) reported payment failure`
      : `Wise webhook (${mode}) confirmed payment`,
    meta: { event_type: pickEventType(event), leg: "retainer" },
  });

  revalidatePath("/dashboard/deals");
  revalidatePath(`/dashboard/deals/${dealId}`);

  return NextResponse.json({
    received: true,
    deal_id: dealId,
    action: failed ? "marked_failed" : "marked_paid",
    mode,
  });
}

function isPaymentFailed(event: Record<string, unknown>): boolean {
  const type = pickEventType(event).toLowerCase();
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const state = String(
    data?.current_state ?? resource?.current_state ?? "",
  ).toLowerCase();

  if (
    type.includes("payment-request") &&
    (type.includes("rejected") || type.includes("cancelled"))
  ) {
    return true;
  }
  if (
    type.includes("transfer") &&
    (state === "bounced_back" ||
      state === "cancelled" ||
      state === "charged_back" ||
      state === "funds_refunded")
  ) {
    return true;
  }
  return false;
}

function extractDealId(event: Record<string, unknown>): string | null {
  const candidates: unknown[] = [];
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const details = resource?.details as Record<string, unknown> | undefined;
  const meta = (event.metadata ?? data?.metadata) as
    | Record<string, unknown>
    | undefined;

  candidates.push(
    details?.reference,
    resource?.reference,
    data?.reference,
    event.reference,
    meta?.deal_id,
    meta?.dealId,
    details?.message,
    resource?.message,
  );

  for (const c of candidates) {
    if (typeof c === "string") {
      const m = c.match(/MS-[A-Z0-9-]+/i);
      if (m) return m[0].toUpperCase();
    }
  }
  return null;
}

function isPaymentSettled(event: Record<string, unknown>): boolean {
  const type = pickEventType(event).toLowerCase();
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const state = String(
    data?.current_state ?? resource?.current_state ?? "",
  ).toLowerCase();

  if (type.includes("payment-request") && type.includes("paid")) return true;
  if (type.includes("balance") && type.includes("credit")) return true;
  if (
    type.includes("transfer") &&
    (state === "outgoing_payment_sent" || state === "funds_converted")
  ) {
    return true;
  }
  return false;
}

function pickEventType(event: Record<string, unknown>): string {
  return String(
    event.event_type ??
      (event.data as Record<string, unknown> | undefined)?.event_type ??
      "",
  );
}

function pickRef(event: Record<string, unknown>): string | null {
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const r =
    resource?.id ??
    (resource as Record<string, unknown> | undefined)?.transfer_id ??
    data?.id;
  return typeof r === "string" || typeof r === "number" ? String(r) : null;
}

function pickAmount(event: Record<string, unknown>): number | null {
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const amount = (resource?.amount ?? data?.amount) as
    | { value?: number }
    | number
    | undefined;
  if (typeof amount === "number") return amount;
  if (amount && typeof amount === "object" && typeof amount.value === "number")
    return amount.value;
  return null;
}
