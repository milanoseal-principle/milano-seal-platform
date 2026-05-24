import { moveDeal } from "@/lib/pipelineEngine";
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stageLabel } from "@/lib/format";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  sendScheduledNotification,
  sendShippedNotification,
  sendCompletedNotification,
} from "@/lib/email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themilanoseal.com";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { deal_id, stage } = await req.json();
  if (!deal_id || !stage)
    return NextResponse.json(
      { error: "deal_id and stage required" },
      { status: 400 }
    );
  const result = await moveDeal(deal_id, stage);
  if (!result.ok)
    return NextResponse.json(
      { error: result.error },
      { status: result.error?.includes("Payment") ? 402 : 409 }
    );

  void (async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const actor = user?.email ?? "admin";
    const action =
      stage === "lost"
        ? "lost"
        : stage === "completed"
        ? "completed"
        : stage === "shipped"
        ? "shipped"
        : "stage_advanced";
    await logActivity({
      deal_id,
      actor,
      action,
      detail: `Stage moved to ${stageLabel(stage)}`,
      meta: { stage },
    });
  })();

  revalidatePath("/dashboard/deals");
  revalidatePath(`/dashboard/deals/${deal_id}`);

  if (["scheduled", "shipped", "completed"].includes(stage)) {
    void (async () => {
      const supabase = createAdminClient();
      const { data: deal } = await supabase
        .from("deals")
        .select(
          "email, client_name, deal_id, access_token, scheduled_at, tracking_number, carrier, invoice_balance, balance_payment_link",
        )
        .eq("deal_id", deal_id)
        .maybeSingle();

      if (!deal?.email) return;
      const portalUrl = deal.access_token
        ? `${SITE}/portal/${deal.access_token}`
        : SITE;
      const name = deal.client_name ?? "there";
      const id = deal.deal_id ?? deal_id;

      if (stage === "scheduled") {
        await sendScheduledNotification({
          to: deal.email,
          name,
          dealId: id,
          scheduledAt: deal.scheduled_at ?? null,
          portalUrl,
        });
      } else if (stage === "shipped") {
        await sendShippedNotification({
          to: deal.email,
          name,
          dealId: id,
          carrier: deal.carrier ?? null,
          trackingNumber: deal.tracking_number ?? null,
          balanceAmount: deal.invoice_balance ? Number(deal.invoice_balance) : null,
          balanceLink: deal.balance_payment_link ?? null,
          portalUrl,
        });
      } else if (stage === "completed") {
        await sendCompletedNotification({
          to: deal.email,
          name,
          dealId: id,
          portalUrl,
        });
      }
    })();
  }

  return NextResponse.json({ ok: true, deal_id, stage });
}
