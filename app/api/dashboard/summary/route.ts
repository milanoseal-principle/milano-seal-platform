import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isClosedWon, isOpenStage } from "@/lib/stateMachine";
import { serializeDealMS, serializeActivityMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });

  const deals = (rows ?? []).map(serializeDealMS);

  const total = deals.length;
  const open = deals.filter((d) => isOpenStage(d.deal_status)).length;
  const closed = deals.filter((d) => isClosedWon(d.deal_status)).length;
  const revClosed = deals
    .filter((d) => isClosedWon(d.deal_status))
    .reduce((s, d) => s + d.total_price, 0);
  const revPipe = deals
    .filter((d) => isOpenStage(d.deal_status))
    .reduce((s, d) => s + d.total_price, 0);

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const intakeToday = deals.filter(
    (d) => new Date(d.created_at) >= startToday
  ).length;
  const intakeWeek = deals.filter(
    (d) => new Date(d.created_at) >= startWeek
  ).length;

  const avgDeal =
    total > 0 ? deals.reduce((s, d) => s + d.total_price, 0) / total : 0;
  const awaiting = deals.filter(
    (d) => d.deal_status === "awaiting_payment"
  ).length;
  const inExec = deals.filter((d) => d.deal_status === "in_execution").length;

  const countryMap = new Map<string, number>();
  for (const d of deals) {
    if (!d.destination_country) continue;
    countryMap.set(
      d.destination_country,
      (countryMap.get(d.destination_country) ?? 0) + 1
    );
  }
  const countries = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const laneMap = new Map<string, number>();
  for (const d of deals) {
    laneMap.set(d.lane, (laneMap.get(d.lane) ?? 0) + 1);
  }
  const lanes = Array.from(laneMap.entries())
    .map(([lane, count]) => ({ lane, count }))
    .sort((a, b) => b.count - a.count);

  const recent_deals = deals.slice(0, 8);

  const { data: activityRows } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(15);
  const recent_activity = (activityRows ?? []).map(serializeActivityMS);

  // New computed fields
  const reviewing_count = deals.filter(
    (d) => d.deal_status === "new" || d.deal_status === "reviewing"
  ).length;
  const scheduled_count = deals.filter(
    (d) => d.deal_status === "scheduled"
  ).length;
  const apostille_count = deals.filter(
    (d) => d.deal_status === "apostille"
  ).length;
  const shipped_count = deals.filter(
    (d) => d.deal_status === "shipped"
  ).length;
  const confirmed_payments = deals.filter(
    (d) => d.payment_status === "paid"
  ).length;
  const pending_payments = deals.filter(
    (d) => isOpenStage(d.deal_status) && d.payment_status !== "paid" && d.payment_status !== "failed"
  ).length;
  const failed_payments = deals.filter(
    (d) => d.payment_status === "failed"
  ).length;
  const balance_due = deals
    .filter((d) => isOpenStage(d.deal_status) && d.payment_status !== "paid")
    .reduce((s, d) => s + d.total_price, 0);

  // Audit logs — gracefully handle missing table
  let security_events: { id: string; event: string; actor: string | null; resource: string | null; created_at: string }[] = [];
  try {
    const { data: auditRows } = await supabase
      .from("audit_logs")
      .select("id, event, actor, resource, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    security_events = auditRows ?? [];
  } catch {
    security_events = [];
  }
  const security_events_count = security_events.length;

  return NextResponse.json({
    total_deals: total,
    open_deals: open,
    closed_deals: closed,
    revenue_closed: revClosed,
    revenue_pipeline: revPipe,
    intake_today: intakeToday,
    intake_week: intakeWeek,
    avg_deal_value: avgDeal,
    awaiting_payment: awaiting,
    in_execution: inExec,
    countries,
    lanes,
    recent_deals,
    recent_activity,
    reviewing_count,
    scheduled_count,
    apostille_count,
    shipped_count,
    confirmed_payments,
    pending_payments,
    failed_payments,
    balance_due,
    security_events,
    security_events_count,
  });
}
