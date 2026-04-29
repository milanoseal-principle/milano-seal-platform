import { createAdminClient } from "@/lib/supabase/admin";

export type DealPriority = "high" | "medium" | "low";

export interface DealScore {
  score: number;
  priority: DealPriority;
  signals: string[];
}

const HIGH_DEMAND_COUNTRIES = ["italy", "greece", "brazil", "argentina", "uae"];
const MEDIUM_DEMAND_COUNTRIES = [
  "spain",
  "portugal",
  "france",
  "germany",
  "mexico",
  "colombia",
];

const HIGH_VALUE_DOCS = [
  "power of attorney",
  "citizenship",
  "one and same",
  "fbi",
  "corporate resolution",
];

export function scoreDeal(deal: Record<string, any>): DealScore {
  let score = 0;
  const signals: string[] = [];

  // Country demand weight
  const country = (deal.country || "").toLowerCase();
  if (HIGH_DEMAND_COUNTRIES.some((c) => country.includes(c))) {
    score += 35;
    signals.push(`High-demand country: ${deal.country}`);
  } else if (MEDIUM_DEMAND_COUNTRIES.some((c) => country.includes(c))) {
    score += 20;
    signals.push(`Active market: ${deal.country}`);
  } else {
    score += 10;
  }

  // Document complexity weight
  const docType = (deal.document_type || "").toLowerCase();
  if (HIGH_VALUE_DOCS.some((d) => docType.includes(d))) {
    score += 30;
    signals.push(`High-value document: ${deal.document_type}`);
  } else {
    score += 15;
  }

  // Deal value weight
  const amount = parseFloat(deal.amount) || 0;
  if (amount >= 1500) {
    score += 25;
    signals.push(`Executive lane: $${amount}`);
  } else if (amount >= 975) {
    score += 18;
    signals.push(`Priority lane: $${amount}`);
  } else if (amount >= 750) {
    score += 12;
    signals.push(`Signature lane: $${amount}`);
  }

  // Apostille multiplier
  if (deal.requires_apostille) {
    score += 15;
    signals.push("Apostille required");
  }

  // Attorney/firm referral
  if (deal.is_attorney) {
    score += 10;
    signals.push("Attorney referral");
  }

  // Urgency
  const timeline = (deal.timeline || "").toLowerCase();
  if (timeline.includes("urgent") || timeline.includes("same day")) {
    score += 20;
    signals.push("Urgent timeline");
  } else if (timeline.includes("expedited")) {
    score += 10;
    signals.push("Expedited timeline");
  }

  // Payment status — paid deals are fully active
  if (deal.payment_status === "paid") {
    score += 20;
    signals.push("Payment confirmed");
  }

  // Staleness penalty — deals idle > 72h without payment lose priority
  if (deal.created_at) {
    const ageHours =
      (Date.now() - new Date(deal.created_at).getTime()) / 3600000;
    if (ageHours > 72 && deal.payment_status !== "paid") {
      score -= 15;
      signals.push("Idle 72h+ — follow-up required");
    }
  }

  const priority: DealPriority =
    score >= 80 ? "high" : score >= 45 ? "medium" : "low";

  return { score: Math.max(0, score), priority, signals };
}

// Score all unpaid deals and update priority field in DB
export async function scoreAllDeals(): Promise<{
  scored: number;
  errors: number;
}> {
  const supabase = createAdminClient();
  const { data: deals, error } = await supabase
    .from("deals")
    .select("*")
    .not("status", "in", '("completed","lost")');

  if (error || !deals) return { scored: 0, errors: 1 };

  let scored = 0,
    errors = 0;
  for (const deal of deals) {
    const { priority } = scoreDeal(deal);
    const { error: upErr } = await supabase
      .from("deals")
      .update({ priority_score: priority })
      .eq("deal_id", deal.deal_id);
    if (upErr) errors++;
    else scored++;
  }

  return { scored, errors };
}
