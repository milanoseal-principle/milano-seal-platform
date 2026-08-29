import type { SearchPerformanceRow, SeoOpportunity, SeoRevenueRow } from "./types";
export function findSeoOpportunities(search: SearchPerformanceRow[], revenue: SeoRevenueRow[], minimumImpressions = 100): SeoOpportunity[] {
  const opportunities: SeoOpportunity[] = [];
  for (const row of search) {
    if (row.impressions >= minimumImpressions && row.position >= 5 && row.position <= 20) opportunities.push({ page: row.page, type: "RANKING", priority: "HIGH", reason: `Position ${row.position.toFixed(1)} with ${row.impressions} impressions` });
    if (row.impressions >= minimumImpressions && row.position <= 10 && row.ctr < 0.02) opportunities.push({ page: row.page, type: "CTR", priority: "HIGH", reason: `CTR ${(row.ctr * 100).toFixed(1)}% below configured expectation` });
  }
  for (const row of revenue) {
    if (row.intakeStarts >= 10 && row.mattersCreated / row.intakeStarts < 0.1) opportunities.push({ page: row.landingPage, type: "CONVERSION", priority: "MEDIUM", reason: "Intake-to-Matter conversion requires review" });
    if (row.paidMatters >= 3 && !search.some((item) => item.page === row.landingPage && item.impressions >= minimumImpressions)) opportunities.push({ page: row.landingPage, type: "REVENUE", priority: "HIGH", reason: "Paid conversion signal exists with low organic visibility" });
  }
  return opportunities;
}
