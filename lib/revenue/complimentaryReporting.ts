import type { ComplimentaryAuthorization } from "@/lib/payments/complimentary-authorization";

export const COMPLIMENTARY_REVENUE_EVENT = "COMPLIMENTARY_MATTER_AUTHORIZED";
export const COMPLIMENTARY_REVENUE_CATEGORY = "non_revenue_complimentary";

export interface ComplimentaryRevenueReportRow {
  matterId: string;
  authorizationId: string;
  commercialValue: number;
  complimentaryAdjustment: number;
  amountCollected: 0;
  verifiedRevenue: 0;
  reasonCode: string;
  authorizingUserId: string;
  status: string;
}

export function buildComplimentaryRevenueReport(authorizations: readonly ComplimentaryAuthorization[]): ComplimentaryRevenueReportRow[] {
  return authorizations.map((auth) => ({
    matterId: auth.matterId,
    authorizationId: auth.id,
    commercialValue: auth.originalTotal,
    complimentaryAdjustment: auth.discountAmount,
    amountCollected: 0,
    verifiedRevenue: 0,
    reasonCode: auth.reasonCode,
    authorizingUserId: auth.authorizedByUserId,
    status: auth.status,
  }));
}

export function excludeComplimentaryFromVerifiedRevenue(row: ComplimentaryRevenueReportRow): boolean {
  return row.verifiedRevenue === 0 && row.amountCollected === 0;
}
