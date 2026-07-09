export interface ContractHistoryRecord { id: string; agencyId: string; opportunityId?: string; vendor: string; awardAmount?: number; startDate?: string; endDate?: string; sourceUrl?: string; notes: string[]; verified: boolean; }
export const CONTRACT_HISTORY: ContractHistoryRecord[] = [];
export function verifiedContractHistory(records = CONTRACT_HISTORY): ContractHistoryRecord[] { return records.filter((record) => record.verified); }
