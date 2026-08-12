/**
 * commercialAccount — recurring maritime/logistics commercial account model.
 * Real data only; account status requires real evidence. No fabricated accounts.
 */

import type { MaritimeRecordMeta } from "@/lib/maritime/maritimeSafety";

export type CommercialAccountType =
  | "customs_broker"
  | "freight_forwarder"
  | "shipping_company"
  | "port_agent"
  | "maritime_law_firm"
  | "customs_law_firm"
  | "logistics_company"
  | "importer_exporter"
  | "manufacturer"
  | "trade_consultant"
  | "marine_finance"
  | "insurance_claims"
  | "yacht_brokerage"
  | "marina"
  | "marine_documentation_agent"
  | "enterprise";

export type CommercialAccountStatus =
  | "target"
  | "contacted"
  | "discovery"
  | "qualified"
  | "proposal_sent"
  | "pilot"
  | "onboarding"
  | "active"
  | "renewal_due"
  | "expanded"
  | "dormant"
  | "lost";

export interface CommercialAccount extends MaritimeRecordMeta {
  organizationId: string | null;
  accountType: CommercialAccountType;
  status: CommercialAccountStatus;
  approvedRequesterIds: string[];
  paidMatterCount: number;
  realRevenueTotal: number;
  renewalDate: string | null;
  relationshipOwner: string | null;
  nextAction: string | null;
}

/** No accounts seeded — none exist with real evidence yet (honest empty state). */
export const COMMERCIAL_ACCOUNT_REGISTRY: CommercialAccount[] = [];

/** Active status requires real, paid evidence — never assumed. */
export function isAccountActive(a: CommercialAccount): boolean {
  return a.status === "active" && !a.isSample && a.paidMatterCount > 0;
}

export function listRealActiveAccounts(): CommercialAccount[] {
  return COMMERCIAL_ACCOUNT_REGISTRY.filter(isAccountActive);
}
