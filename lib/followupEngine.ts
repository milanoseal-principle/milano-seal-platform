import { createAdminClient } from "@/lib/supabase/admin";

interface FollowUpResult {
  deal_id: string;
  client_name: string;
  step: "24h" | "72h" | "7d";
  channel: "sms" | "log";
  sent: boolean;
  error?: string;
}

const MESSAGES = {
  "24h": (name: string, amount: number) =>
    `Hi ${name} — following up on your document matter with The Milano Seal™. Your retainer of $${Math.round(
      amount * 0.5
    )} secures your execution date. Any questions before we proceed?`,
  "72h": (name: string, _amount: number) =>
    `${name} — Nicholas Milano here. Your matter is still open. I want to make sure we get this executed properly for you. Reply here or submit payment when ready.`,
  "7d": (name: string, _amount: number) =>
    `${name} — final follow-up on your Milano Seal matter. Your spot can be released after today. Reply if you'd like to proceed — happy to answer any questions.`,
};

export async function runFollowups(): Promise<FollowUpResult[]> {
  const supabase = createAdminClient();
  const results: FollowUpResult[] = [];

  // Only follow up on unpaid deals
  const { data: deals } = await supabase
    .from("deals")
    .select(
      "deal_id, client_name, email, phone, amount, status, payment_status, followup_24h, followup_72h, followup_7d, created_at"
    )
    .eq("payment_status", "unpaid")
    .not("status", "in", '("completed","lost")');

  if (!deals?.length) return results;

  const now = Date.now();

  for (const deal of deals) {
    const ageHours = (now - new Date(deal.created_at).getTime()) / 3600000;
    const name = (deal.client_name || "").split(" ")[0] || "there";
    const amount = parseFloat(deal.amount) || 750;

    // 24h follow-up
    if (ageHours >= 24 && !deal.followup_24h) {
      const msg = MESSAGES["24h"](name, amount);
      const sent = await sendFollowUp(deal, msg, "24h");
      await supabase
        .from("deals")
        .update({ followup_24h: true })
        .eq("deal_id", deal.deal_id);
      results.push({
        deal_id: deal.deal_id,
        client_name: deal.client_name,
        step: "24h",
        channel: deal.phone ? "sms" : "log",
        sent,
      });
    }

    // 72h follow-up
    if (ageHours >= 72 && !deal.followup_72h) {
      const msg = MESSAGES["72h"](name, amount);
      const sent = await sendFollowUp(deal, msg, "72h");
      await supabase
        .from("deals")
        .update({ followup_72h: true })
        .eq("deal_id", deal.deal_id);
      results.push({
        deal_id: deal.deal_id,
        client_name: deal.client_name,
        step: "72h",
        channel: deal.phone ? "sms" : "log",
        sent,
      });
    }

    // 7d follow-up
    if (ageHours >= 168 && !deal.followup_7d) {
      const msg = MESSAGES["7d"](name, amount);
      const sent = await sendFollowUp(deal, msg, "7d");
      await supabase
        .from("deals")
        .update({ followup_7d: true })
        .eq("deal_id", deal.deal_id);
      results.push({
        deal_id: deal.deal_id,
        client_name: deal.client_name,
        step: "7d",
        channel: deal.phone ? "sms" : "log",
        sent,
      });
    }
  }

  return results;
}

async function sendFollowUp(
  deal: any,
  message: string,
  step: string
): Promise<boolean> {
  if (!deal.phone) {
    console.log(
      `[Follow-up ${step}] No phone for ${deal.client_name} — logged only`
    );
    return false;
  }
  try {
    const { sendSMS } = await import("@/lib/twilio");
    await sendSMS(deal.phone, message);
    return true;
  } catch (e) {
    console.error(`[Follow-up ${step}] SMS failed for ${deal.deal_id}:`, e);
    return false;
  }
}
