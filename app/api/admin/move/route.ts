import { moveDeal } from "@/lib/pipelineEngine";
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { stageLabel } from "@/lib/format";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sendScheduledNotification, sendShippedNotification, sendCompletedNotification } from "@/lib/email";
import { notifyClient } from "@/lib/notifications/orchestrator";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themilanoseal.com";
const MOVE_ROLES = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager", "execution_coordinator", "apostille_coordinator", "virtual_assistant"]);
const PROTECTED_STAGES = new Set(["scheduled", "in_execution"]);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const role = await resolveServerRole(user);
  if (!MOVE_ROLES.has(role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { deal_id, stage } = await req.json();
  if (!deal_id || !stage) return NextResponse.json({ error: "deal_id and stage required" }, { status: 400 });
  if (PROTECTED_STAGES.has(stage) && !canPerformProtectedMatterTransition(role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const result = await moveDeal(deal_id, stage);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error?.includes("Payment") ? 402 : 409 });

  const actor = user.email ?? user.id;
  void logActivity({
    deal_id,
    actor,
    action: stage === "lost" ? "lost" : stage === "completed" ? "completed" : stage === "shipped" ? "shipped" : "stage_advanced",
    detail: `Stage moved to ${stageLabel(stage)}`,
    meta: { stage },
  }).catch((error) => console.error("[activity] stage move log failed:", error));

  revalidatePath("/dashboard/deals");
  revalidatePath(`/dashboard/deals/${deal_id}`);

  if (["scheduled", "shipped", "completed"].includes(stage)) {
    void (async () => {
      const supabase = createAdminClient();
      const { data: deal } = await supabase
        .from("deals")
        .select("id, email, client_name, deal_id, access_token, scheduled_at, tracking_number, carrier, invoice_balance, balance_payment_link")
        .eq("deal_id", deal_id)
        .maybeSingle();
      if (!deal?.email) return;

      const portalUrl = deal.access_token ? `${SITE}/portal/${deal.access_token}` : SITE;
      const name = deal.client_name ?? "there";
      const id = deal.deal_id ?? deal_id;

      if (stage === "scheduled") {
        await sendScheduledNotification({ to: deal.email, name, dealId: id, scheduledAt: deal.scheduled_at ?? null, portalUrl });
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
        await sendCompletedNotification({ to: deal.email, name, dealId: id, portalUrl });
      }

      if (deal.id) {
        const event = stage === "scheduled" ? "execution_scheduled" : stage === "shipped" ? "shipped" : "completed";
        await notifyClient(deal.id, event);
      }
    })();
  }

  return NextResponse.json({ ok: true, deal_id, stage });
}
