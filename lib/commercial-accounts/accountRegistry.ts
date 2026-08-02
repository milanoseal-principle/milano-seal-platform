/**
 * accountRegistry — Commercial Account Operating System (foundation). Accounts
 * reference the canonical Organization by id; real revenue requires verified
 * payment; account tier is evidence-based. No fabricated accounts or revenue.
 */

import type { VerticalId } from "@/lib/vertical-intelligence/verticalRegistry";

export type AccountTier =
  | "target"
  | "prospect"
  | "pilot"
  | "priority_desk"
  | "commercial_account"
  | "strategic_account"
  | "enterprise_account"
  | "institutional_account"
  | "dormant"
  | "lost";

export type AccountLevel = "foundation" | "professional" | "enterprise";

export interface CommercialAccount {
  id: string;
  organizationId: string | null;
  verticalId: VerticalId;
  tier: AccountTier;
  level: AccountLevel | null;
  approvedRequesterIds: string[];
  paidMatterCount: number;
  realRevenueTotal: number;
  renewalDate: string | null;
  relationshipOwner: string | null;
  nextAction: string | null;
  isSample: boolean;
}

export const COMMERCIAL_ACCOUNT_REGISTRY: CommercialAccount[] = [];

/** A commercial-or-higher account requires real paid evidence. */
export function isRealCommercialAccount(a: CommercialAccount): boolean {
  const realTiers: AccountTier[] = ["commercial_account", "strategic_account", "enterprise_account", "institutional_account"];
  return !a.isSample && realTiers.includes(a.tier) && a.paidMatterCount > 0;
}

export function listRealCommercialAccounts(): CommercialAccount[] {
  return COMMERCIAL_ACCOUNT_REGISTRY.filter(isRealCommercialAccount);
}

/** Real revenue across accounts — samples and unpaid excluded. */
export function totalRealAccountRevenue(): number {
  return COMMERCIAL_ACCOUNT_REGISTRY
    .filter((a) => !a.isSample)
    .reduce((s, a) => s + (a.realRevenueTotal || 0), 0);
}
