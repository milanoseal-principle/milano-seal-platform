import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWiseMode } from "@/lib/wise";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/**
 * Sandbox-only helper: lets an admin mark a deal as paid (or failed) the same
 * way the Wise webhook would. Mutates the deals row through the same paths the
 * production webhook uses so dashboards, activity log, and SLAs all update.
 *
 * This route refuses to do anything in production mode — to ship payments into
 * a real deal you must use the actual Wise webhook.
 */
export async function POST(req: NextRequest) {
  const mode = getWiseMode();
  if (mode !== "test") {
    return NextResponse.json(
      {
        error:
          "Replay is sandbox-only. Set WISE_MODE=test before using this endpoint.",
      },
      { status: 403 },
    );
  }

  let body: {
    deal_id?: string;
    leg?: "retainer" | "balance";
    outcome?: "paid" | "failed";
    amount?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dealId = (body.deal_id ?? "").trim().toUpperCase();
  if (!dealId) {
    return NextResponse.json({ error: "deal_id is required" }, { status: 400 });
  }
  const leg = body.leg === "balance" ? "balance" : "retainer";
  const outcome = body.outcome === "failed" ? "failed" : "paid";
  const amount = typeof body.amount === "number" ? body.amount : null;

  const supabase = createAdminClient();

  if (leg === "balance") {
    const update: Record<string, unknown> =
      outcome === "paid"
        ? {
            balance_payment_status: "paid",
            balance_amount_received: amount,
            balance_paid_at: new Date().toISOString(),
          }
        : { balance_payment_status: "failed" };

    const { data: deal, error } = await supabase
      .from("deals")
      .update(update)
      .eq("deal_id", dealId)
      .select()
      .maybeSingle();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    if (!deal)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    void logActivity({
      deal_id: dealId,
      actor: "wise-sandbox-replay",
      action: outcome === "paid" ? "payment_confirmed" : "payment_updated",
      detail: `Sandbox replay (${mode}) — balance marked ${outcome}`,
      meta: { source: "admin_replay", leg },
    });

    revalidatePath("/dashboard/deals");
    revalidatePath(`/dashboard/deals/${dealId}`);
    revalidatePath("/dashboard/admin/payments");
    return NextResponse.json({ ok: true, deal_id: dealId, leg, outcome, mode });
  }

  const update: Record<string, unknown> =
    outcome === "paid"
      ? {
          payment_status: "paid",
          payment_method: "wise",
          payment_reference: dealId,
          payment_amount_received: amount,
        }
      : {
          payment_status: "failed",
          payment_failed_at: new Date().toISOString(),
          payment_failure_reason: "sandbox_replay_failed",
        };

  const { data: deal, error } = await supabase
    .from("deals")
    .update(update)
    .eq("deal_id", dealId)
    .select()
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deal)
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  void logActivity({
    deal_id: dealId,
    actor: "wise-sandbox-replay",
    action: outcome === "paid" ? "payment_confirmed" : "payment_updated",
    detail: `Sandbox replay (${mode}) — retainer marked ${outcome}`,
    meta: { source: "admin_replay", leg },
  });

  revalidatePath("/dashboard/deals");
  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/admin/payments");
  return NextResponse.json({ ok: true, deal_id: dealId, leg, outcome, mode });
}
