import type { ClientRegistryRecord, MatterCommandRecord } from "./types";

function key(name: string): string {
  return name.trim().toLowerCase();
}

function money(value: number | null | undefined): number {
  return Number.isFinite(value ?? NaN) ? Number(value) : 0;
}

export function buildClientRegistry(records: MatterCommandRecord[]): ClientRegistryRecord[] {
  const groups = new Map<string, MatterCommandRecord[]>();
  for (const record of records) {
    const clientKey = key(record.clientName || "Unknown Client");
    groups.set(clientKey, [...(groups.get(clientKey) ?? []), record]);
  }

  return Array.from(groups.values()).map((clientRecords, index) => {
    const first = clientRecords[0];
    const lifetimeValue = calculateLifetimeValue(first.clientName, records);
    const totalDeals = clientRecords.length;
    return {
      clientId: `client-${index + 1}`,
      clientName: first.clientName,
      clientType: first.clientType,
      organization: null,
      email: null,
      phone: null,
      whatsapp: null,
      country: first.country,
      referralSource: first.referralSource,
      totalDeals,
      lifetimeValue,
      lastDealDate: getLastActivity(first.clientName, records),
      openDeals: calculateOpenDeals(first.clientName, records),
      repeatClient: detectRepeatClient(first.clientName, records),
      clientTier: classifyClientTier(lifetimeValue, totalDeals),
    };
  });
}

export function calculateLifetimeValue(clientName: string, records: MatterCommandRecord[]): number {
  const clientKey = key(clientName);
  return records.filter((record) => key(record.clientName) === clientKey).reduce((sum, record) => sum + money(record.amountCollected ?? record.amountPaid ?? record.finalPrice), 0);
}

export function calculateOpenDeals(clientName: string, records: MatterCommandRecord[]): number {
  const clientKey = key(clientName);
  return records.filter((record) => key(record.clientName) === clientKey && !/completed|closed/i.test(`${record.status ?? ""} ${record.masterStatus ?? ""} ${record.closeStatus ?? ""}`)).length;
}

export function detectRepeatClient(clientName: string, records: MatterCommandRecord[]): boolean {
  return records.filter((record) => key(record.clientName) === key(clientName)).length > 1;
}

export function classifyClientTier(lifetimeValue: number, totalDeals: number): string {
  if (lifetimeValue >= 10000 || totalDeals >= 5) return "Strategic Relationship";
  if (lifetimeValue >= 5000 || totalDeals >= 3) return "Priority Relationship";
  if (lifetimeValue > 0) return "Active Client";
  return "New / Unqualified";
}

export function getLastActivity(clientName: string, records: MatterCommandRecord[]): string | null {
  const dates = records
    .filter((record) => key(record.clientName) === key(clientName))
    .map((record) => record.lastUpdated ?? record.dateCreated)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return dates[0] ?? null;
}
