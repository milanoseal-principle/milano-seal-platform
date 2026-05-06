import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, sendAdminAlert } from "@/lib/whatsapp";
import { audit } from "@/lib/audit";
import { checkAndAlert, MonitorableDeal } from "@/lib/slaMonitor";

export interface AutomationDeal extends MonitorableDeal {
  id?: string;
  deal_id?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  payment_status?: string | null;
  client_name?: string | null;
  payment_link?: string | null;
}

export async function runAutomation(deal: AutomationDeal): Promise<void> {
  try {
    await Promise.allSettled([
      handleAwaitingPayment(deal),
      handleDelivered(deal),
      checkAndAlert(deal),
    ]);
  } catch (err) {
    console.error(
      "[automation] dispatch failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

async function handleAwaitingPayment(deal: AutomationDeal): Promise<void> {
  if (deal.status !== "awaiting_payment") return;
  if (deal.payment_status === "paid") return;

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("deal_events")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", deal.id ?? "")
    .eq("event", "FOLLOWUP_PAYMENT_REMINDER")
    .gte("created_at", since);

  if ((count ?? 0) > 0) return;

  if (deal.phone) {
    void sendWhatsApp(
      deal.phone,
      `Milano Seal: a friendly reminder — your retainer for matter ${
        deal.deal_id ?? deal.id
      } is awaiting payment.${deal.payment_link ? `\nPay: ${deal.payment_link}` : ""}`,
      { dealId: deal.id ?? null },
    ).catch(() => {});
  }

  await supabase.from("deal_events").insert({
    deal_id: deal.id ?? null,
    event: "FOLLOWUP_PAYMENT_REMINDER",
    payload: { channel: "whatsapp", dispatched: true },
  });

  await audit({
    event: "automation.payment_reminder",
    resource: deal.id ? `deal:${deal.id}` : null,
    payload: { deal_id: deal.deal_id, phone: !!deal.phone },
  });
}

async function handleDelivered(deal: AutomationDeal): Promise<void> {
  if (deal.status !== "completed") return;
  if (deal.delivery_status !== "delivered") return;

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("deal_events")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", deal.id ?? "")
    .eq("event", "REVIEW_REQUEST_SENT");

  if ((count ?? 0) > 0) return;

  if (deal.phone) {
    void sendWhatsApp(
      deal.phone,
      `Milano Seal: your matter is closed. If we earned it, a one-line review means the world to us — thank you.`,
      { dealId: deal.id ?? null },
    ).catch(() => {});
  }
  void sendAdminAlert(
    `Deal ${deal.deal_id ?? deal.id} closed — review request dispatched.`,
  ).catch(() => {});

  await supabase.from("deal_events").insert({
    deal_id: deal.id ?? null,
    event: "REVIEW_REQUEST_SENT",
    payload: { channel: "whatsapp" },
  });

  await audit({
    event: "automation.review_request",
    resource: deal.id ? `deal:${deal.id}` : null,
    payload: { deal_id: deal.deal_id },
  });
}
