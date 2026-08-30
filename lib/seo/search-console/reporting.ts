import { createAdminClient } from '@/lib/supabase/admin';
import { searchConsoleConfigured } from './client';

export interface SeoOpportunity {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export async function getSeoRevenueFeedback(days = 28) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const [{ data: observations }, { data: paidMatters }] = await Promise.all([
    admin.from('seo_search_console_observations')
      .select('query, page, clicks, impressions, ctr, position, observed_date')
      .gte('observed_date', since)
      .order('impressions', { ascending: false })
      .limit(5000),
    admin.from('deals')
      .select('id, destination_country, document_type, payment_confirmed, payment_status, amount_paid, verified_revenue, created_at')
      .eq('payment_confirmed', true)
      .gte('created_at', new Date(Date.now() - days * 86400000).toISOString()),
  ]);

  const byQuery = new Map<string, { query: string; page: string; impressions: number; clicks: number; weightedPosition: number }>();
  for (const row of observations ?? []) {
    const key = `${row.query}::${row.page}`;
    const current = byQuery.get(key) ?? { query: row.query, page: row.page, impressions: 0, clicks: 0, weightedPosition: 0 };
    const impressions = Number(row.impressions ?? 0);
    current.impressions += impressions;
    current.clicks += Number(row.clicks ?? 0);
    current.weightedPosition += Number(row.position ?? 0) * Math.max(1, impressions);
    byQuery.set(key, current);
  }

  const opportunities: SeoOpportunity[] = [...byQuery.values()].map((item) => {
    const position = item.weightedPosition / Math.max(1, item.impressions);
    const ctr = item.clicks / Math.max(1, item.impressions);
    const priority: SeoOpportunity['priority'] = item.impressions >= 500 && position >= 4 && position <= 20 ? 'HIGH' : item.impressions >= 100 ? 'MEDIUM' : 'LOW';
    return { query: item.query, page: item.page, impressions: item.impressions, clicks: item.clicks, ctr, position, priority };
  }).sort((a,b) => (a.priority === b.priority ? b.impressions - a.impressions : a.priority === 'HIGH' ? -1 : b.priority === 'HIGH' ? 1 : 0)).slice(0, 50);

  const paid = paidMatters ?? [];
  const verifiedRevenue = paid.reduce((sum, matter) => sum + Number(matter.verified_revenue ?? matter.amount_paid ?? 0), 0);
  return {
    configured: searchConsoleConfigured(),
    windowDays: days,
    observations: observations?.length ?? 0,
    paidMatters: paid.length,
    verifiedRevenue,
    opportunities,
    attributionBoundary: 'Search Console performance and paid Matter revenue are reported from verified sources. Query-to-revenue causal attribution is not claimed unless a Matter carries matching acquisition evidence.',
  };
}
