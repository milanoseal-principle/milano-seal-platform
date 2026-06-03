export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DocumentDemand } from "@/components/dashboard/DocumentDemand";

export const metadata = {
  title: "Document Demand Engine — Milano Seal",
  robots: { index: false },
};

export interface DocDemandRow {
  document_type: string;
  count: number;
  revenue: number;
  conversion_rate: number;
}

export interface CorridorDemandRow {
  key: string;
  country: string;
  document: string;
  count: number;
  revenue: number;
  avg_value: number;
}

export interface MonthTrendRow {
  label: string;
  count: number;
  isCurrent: boolean;
}

export interface ReferralRow {
  source: string;
  count: number;
  revenue: number;
}

export interface CountryRow {
  country: string;
  count: number;
  revenue: number;
}

function fmtMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DemandPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const { data: deals } = await supabase
    .from("deals")
    .select(
      "document_type, destination_country, total_price, payment_status, referral_source, created_at, matter_status"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = deals ?? [];

  // ── Top documents ────────────────────────────────────────────────────────
  const docMap = new Map<string, { count: number; paid: number; revenue: number }>();
  for (const r of rows) {
    if (!r.document_type) continue;
    const entry = docMap.get(r.document_type) ?? { count: 0, paid: 0, revenue: 0 };
    entry.count++;
    if (r.payment_status === "paid") {
      entry.paid++;
      entry.revenue += Number(r.total_price) || 0;
    }
    docMap.set(r.document_type, entry);
  }
  const topDocuments: DocDemandRow[] = Array.from(docMap.entries())
    .map(([document_type, v]) => ({
      document_type,
      count: v.count,
      revenue: v.revenue,
      conversion_rate: v.count > 0 ? Math.round((v.paid / v.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Top corridors ────────────────────────────────────────────────────────
  const corridorMap = new Map<string, { count: number; revenue: number }>();
  for (const r of rows) {
    if (!r.destination_country || !r.document_type) continue;
    const key = `${r.destination_country}::${r.document_type}`;
    const entry = corridorMap.get(key) ?? { count: 0, revenue: 0 };
    entry.count++;
    if (r.payment_status === "paid") entry.revenue += Number(r.total_price) || 0;
    corridorMap.set(key, entry);
  }
  const topCorridors: CorridorDemandRow[] = Array.from(corridorMap.entries())
    .map(([key, v]) => {
      const [country, document] = key.split("::");
      return {
        key,
        country,
        document,
        count: v.count,
        revenue: v.revenue,
        avg_value: v.count > 0 ? Math.round(v.revenue / v.count) : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ── Monthly trend (last 12 months) ───────────────────────────────────────
  const now = new Date();
  const currentMonth = fmtMonth(now);
  const monthMap = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap.set(fmtMonth(d), 0);
  }
  for (const r of rows) {
    if (!r.created_at) continue;
    const m = fmtMonth(new Date(r.created_at));
    if (monthMap.has(m)) monthMap.set(m, (monthMap.get(m) ?? 0) + 1);
  }
  const monthlyTrend: MonthTrendRow[] = Array.from(monthMap.entries()).map(([key, count]) => ({
    label: key.slice(5) + "/" + key.slice(2, 4),
    count,
    isCurrent: key === currentMonth,
  }));

  // ── Referral sources ─────────────────────────────────────────────────────
  const refMap = new Map<string, { count: number; revenue: number }>();
  for (const r of rows) {
    const src = r.referral_source || "Unknown";
    const entry = refMap.get(src) ?? { count: 0, revenue: 0 };
    entry.count++;
    if (r.payment_status === "paid") entry.revenue += Number(r.total_price) || 0;
    refMap.set(src, entry);
  }
  const referralSources: ReferralRow[] = Array.from(refMap.entries())
    .map(([source, v]) => ({ source, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Top countries ────────────────────────────────────────────────────────
  const countryMap = new Map<string, { count: number; revenue: number }>();
  for (const r of rows) {
    if (!r.destination_country) continue;
    const entry = countryMap.get(r.destination_country) ?? { count: 0, revenue: 0 };
    entry.count++;
    if (r.payment_status === "paid") entry.revenue += Number(r.total_price) || 0;
    countryMap.set(r.destination_country, entry);
  }
  const topCountries: CountryRow[] = Array.from(countryMap.entries())
    .map(([country, v]) => ({ country, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <DocumentDemand
      topDocuments={topDocuments}
      topCorridors={topCorridors}
      monthlyTrend={monthlyTrend}
      referralSources={referralSources}
      topCountries={topCountries}
    />
  );
}
