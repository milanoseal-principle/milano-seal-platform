import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = [
  "new", "intake_received", "under_review", "compliance_review", "quoted",
  "awaiting_payment", "payment_confirmed", "scheduled", "in_execution",
  "apostille_processing", "courier_ready", "shipped",
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!["founder_admin", "admin_operator"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClient();

  const { data: allDeals } = await db
    .from("deals")
    .select("id, deal_id, client_name, document_type, destination_country, lane, total_price, deal_status, conversion_score, created_at");

  const deals = allDeals ?? [];

  const score_tiers = { high: 0, medium: 0, low: 0 };
  deals.forEach(d => {
    const s = d.conversion_score ?? 0;
    if (s >= 70) score_tiers.high++;
    else if (s >= 40) score_tiers.medium++;
    else score_tiers.low++;
  });

  const { data: hvRaw } = await db
    .from("deals")
    .select("id, deal_id, client_name, document_type, destination_country, total_price, conversion_score, deal_status")
    .gte("conversion_score", 70)
    .not("deal_status", "in", "(completed,closed,cancelled,delivered)")
    .order("conversion_score", { ascending: false })
    .limit(8);

  const countryMap = new Map<string, { count: number; revenue: number }>();
  deals.forEach(d => {
    const c = d.destination_country ?? "Unknown";
    const cur = countryMap.get(c) ?? { count: 0, revenue: 0 };
    countryMap.set(c, { count: cur.count + 1, revenue: cur.revenue + (d.total_price ?? 0) });
  });
  const country_demand = Array.from(countryMap.entries())
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const docMap = new Map<string, { count: number; revenue: number }>();
  deals.forEach(d => {
    const t = d.document_type ?? "Unknown";
    const cur = docMap.get(t) ?? { count: 0, revenue: 0 };
    docMap.set(t, { count: cur.count + 1, revenue: cur.revenue + (d.total_price ?? 0) });
  });
  const document_demand = Array.from(docMap.entries())
    .map(([document_type, v]) => ({ document_type, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const laneMap = new Map<string, number>();
  deals.forEach(d => {
    const l = d.lane ?? "Standard";
    laneMap.set(l, (laneMap.get(l) ?? 0) + 1);
  });
  const lane_distribution = Array.from(laneMap.entries())
    .map(([lane, count]) => ({ lane, count }))
    .sort((a, b) => b.count - a.count);

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: abandonedRaw } = await db
    .from("deals")
    .select("id, deal_id, client_name, document_type, destination_country, deal_status, created_at")
    .in("deal_status", ["new", "intake_received", "under_review"])
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(10);

  const abandoned_intake = (abandonedRaw ?? []).map(d => ({
    ...d,
    hours_stale: Math.round((Date.now() - new Date(d.created_at).getTime()) / 3_600_000),
  }));

  const active = deals.filter(d => ACTIVE_STATUSES.includes(d.deal_status ?? ""));

  return NextResponse.json({
    score_tiers,
    high_value_matters: hvRaw ?? [],
    country_demand,
    document_demand,
    lane_distribution,
    abandoned_intake,
    total_active: active.length,
    total_pipeline_value: active.reduce((s, d) => s + (d.total_price ?? 0), 0),
  });
}
