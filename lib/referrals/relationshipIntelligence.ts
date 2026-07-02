import type { ReferralRelationshipRecord } from "./types";

export const REFERRAL_SOURCE_OF_TRUTH = "deals" as const;
export const EMPTY_REFERRAL_STATE = "No referral records connected yet.";

export function attachReferralToDeal(record: Omit<ReferralRelationshipRecord, "attachedToDeal">): ReferralRelationshipRecord {
  return { ...record, attachedToDeal: true };
}

export function getReferralEmptyState(records: ReferralRelationshipRecord[]): string | null {
  return records.length === 0 ? EMPTY_REFERRAL_STATE : null;
}

export function groupReferralsByDeal(records: ReferralRelationshipRecord[]): Record<string, ReferralRelationshipRecord[]> {
  return records.reduce<Record<string, ReferralRelationshipRecord[]>>((groups, record) => {
    groups[record.dealId] = [...(groups[record.dealId] ?? []), record];
    return groups;
  }, {});
}
