export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [dealsRes, referralRes, authRes] = await Promise.all([
    admin
      .from("deals")
      .select("id, total_price, payment_status, matter_status, destination_country, created_at"),
    admin
      .from("referral_ledger")
      .select("id, source_type, deal_id, created_at")
      .limit(500),
    admin
      .from("receiving_authorities")
      .select("id, authority_confidence, country_id"),
  ]);

  const deals = dealsRes.data ?? [];
  const COMPLETED = ["completed", "closed", "delivered"];
  const PAID = ["paid", "confirmed"];

  const cash_collected = deals
    .filter((d) => PAID.includes(d.payment_status ?? "") && COMPLETED.includes(d.matter_status ?? ""))
    .reduce((sum, d) => sum + (Number(d.total_price) || 0), 0);

  const pipeline_value = deals
    .filter((d) => !COMPLETED.includes(d.matter_status ?? ""))
    .reduce((sum, d) => sum + (Number(d.total_price) || 0), 0);

  const open_matters = deals.filter((d) => !COMPLETED.includes(d.matter_status ?? "")).length;

  // Revenue by country (top 5)
  const countryRev = new Map<string, number>();
  for (const d of deals) {
    if (PAID.includes(d.payment_status ?? "")) {
      const c = d.destination_country ?? "Unknown";
      countryRev.set(c, (countryRev.get(c) ?? 0) + (Number(d.total_price) || 0));
    }
  }
  const revenue_by_country = Array.from(countryRev.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, revenue]) => ({ country, revenue }));

  // Revenue by source
  const referrals = referralRes.data ?? [];
  const sourceMap = new Map<string, number>();
  for (const r of referrals) {
    const src = r.source_type ?? "direct";
    sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
  }
  const revenue_by_source = Array.from(sourceMap.entries())
    .map(([source_type, count]) => ({ source_type, count }))
    .sort((a, b) => b.count - a.count);

  // Monthly trend — last 6 months
  const monthly: Record<string, { month: string; count: number; revenue: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = { month: key, count: 0, revenue: 0 };
  }
  for (const deal of deals) {
    if (!deal.created_at) continue;
    const d = new Date(deal.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthly[key]) {
      monthly[key].count++;
      if (PAID.includes(deal.payment_status ?? "")) {
        monthly[key].revenue += Number(deal.total_price) || 0;
      }
    }
  }
  const monthly_trend = Object.values(monthly);

  // Authority verification pct
  const authorities = authRes.data ?? [];
  const verified = authorities.filter(
    (a) => a.authority_confidence === "AUTHORITY_VERIFIED" || a.authority_confidence === "MULTI_SOURCE_CONFIRMED",
  ).length;
  const authority_verification_pct = authorities.length > 0
    ? Math.round((verified / authorities.length) * 100)
    : 0;

  return NextResponse.json({
    cash_collected,
    pipeline_value,
    open_matters,
    revenue_by_country,
    revenue_by_source,
    monthly_trend,
    authority_verification_pct,
    total_authorities: authorities.length,
    verified_authorities: verified,
  });
}
