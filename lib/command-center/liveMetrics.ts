import { createAdminClient } from "@/lib/supabase/admin";

export interface CommandCenterLiveMetrics {
  currency: string;
  totalCollected: number;
  totalOutstanding: number;
  ytdRevenue: number;
  averageDealValue: number;
  highestValueDeal: number;
  italyLaneRevenue: number;
  totalDeals: number;
  active: number;
  awaitingPayment: number;
  scheduled: number;
  inExecution: number;
  apostilleProcessing: number;
  completedDeals: number;
  highRiskDeals: number;
  source: "supabase" | "unavailable";
}

function money(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function canonicalCollected(row: Record<string, unknown>): number {
  const verified = money(row.verified_revenue);
  if (verified > 0) return verified;
  if (row.payment_confirmed === true || row.payment_status === "paid") return money(row.amount_paid);
  return 0;
}

export async function getCommandCenterLiveMetrics(): Promise<CommandCenterLiveMetrics> {
  const empty: CommandCenterLiveMetrics = {
    currency: "USD",
    totalCollected: 0,
    totalOutstanding: 0,
    ytdRevenue: 0,
    averageDealValue: 0,
    highestValueDeal: 0,
    italyLaneRevenue: 0,
    totalDeals: 0,
    active: 0,
    awaitingPayment: 0,
    scheduled: 0,
    inExecution: 0,
    apostilleProcessing: 0,
    completedDeals: 0,
    highRiskDeals: 0,
    source: "unavailable",
  };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("deals")
      .select(
        "deal_id,status,deal_status,payment_status,payment_confirmed,payment_confirmed_at,amount_paid,amount_due,verified_revenue,final_total,total_price,currency,destination_country,decline_risk,created_at,completed_at",
      )
      .limit(5000);

    if (error || !data) return empty;

    const rows = data as Array<Record<string, unknown>>;
    const usd = rows.filter((row) => !row.currency || String(row.currency).toUpperCase() === "USD");
    const currentYear = new Date().getUTCFullYear();
    const collected = usd.map((row) => canonicalCollected(row));
    const totalCollected = money(collected.reduce((sum, value) => sum + value, 0));
    const totalOutstanding = money(
      usd.reduce((sum, row) => {
        const due = money(row.amount_due);
        const paid = money(row.amount_paid);
        return sum + Math.max(0, due - paid);
      }, 0),
    );
    const ytdRevenue = money(
      usd.reduce((sum, row) => {
        const confirmedAt = row.payment_confirmed_at ? new Date(String(row.payment_confirmed_at)) : null;
        if (!confirmedAt || Number.isNaN(confirmedAt.getTime()) || confirmedAt.getUTCFullYear() !== currentYear) return sum;
        return sum + canonicalCollected(row);
      }, 0),
    );
    const dealValues = usd.map((row) => money(row.final_total || row.total_price)).filter((value) => value > 0);
    const averageDealValue = dealValues.length ? money(dealValues.reduce((sum, value) => sum + value, 0) / dealValues.length) : 0;
    const highestValueDeal = dealValues.length ? Math.max(...dealValues) : 0;
    const italyLaneRevenue = money(
      usd.reduce((sum, row) => /italy/i.test(String(row.destination_country ?? "")) ? sum + canonicalCollected(row) : sum, 0),
    );
    const state = (row: Record<string, unknown>) => String(row.status || row.deal_status || "").toLowerCase();

    return {
      currency: "USD",
      totalCollected,
      totalOutstanding,
      ytdRevenue,
      averageDealValue,
      highestValueDeal,
      italyLaneRevenue,
      totalDeals: rows.length,
      active: rows.filter((row) => ["intake_received", "reviewing", "quoted"].includes(state(row))).length,
      awaitingPayment: rows.filter((row) => state(row) === "awaiting_payment" || row.payment_status === "unpaid").length,
      scheduled: rows.filter((row) => state(row) === "scheduled").length,
      inExecution: rows.filter((row) => state(row) === "in_execution").length,
      apostilleProcessing: rows.filter((row) => ["apostille", "apostille_processing"].includes(state(row))).length,
      completedDeals: rows.filter((row) => state(row) === "completed").length,
      highRiskDeals: rows.filter((row) => Number(row.decline_risk ?? 0) >= 70).length,
      source: "supabase",
    };
  } catch {
    return empty;
  }
}
