export interface SearchPerformanceRow { query: string; page: string; country?: string; device?: string; clicks: number; impressions: number; ctr: number; position: number; startDate: string; endDate: string }
export interface SeoRevenueRow { landingPage: string; country?: string; document?: string; intent?: string; intakeStarts: number; mattersCreated: number; paidMatters: number; recognizedRevenue: number }
export interface SeoOpportunity { page: string; type: "RANKING" | "CTR" | "CONVERSION" | "REVENUE"; priority: "HIGH" | "MEDIUM"; reason: string }
