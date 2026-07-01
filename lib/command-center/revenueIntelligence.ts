import type { MatterCommandRecord } from "./types";

const CLOSED = new Set(["completed", "closed"]);
const CORE_LANES = new Set(["Signature", "Priority", "Executive"]);

function money(value: number | null | undefined): number {
  return Number.isFinite(value ?? NaN) ? Number(value) : 0;
}

function lower(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function isClosed(record: MatterCommandRecord): boolean {
  return CLOSED.has(lower(record.masterStatus)) || CLOSED.has(lower(record.status)) || CLOSED.has(lower(record.closeStatus));
}

export function calculateTotalDeals(records: MatterCommandRecord[]): number {
  return records.length;
}

export function calculateCollectedRevenue(records: MatterCommandRecord[]): number {
  return records.reduce((sum, record) => sum + money(record.amountCollected ?? record.amountPaid), 0);
}

export function calculateOutstandingRevenue(records: MatterCommandRecord[]): number {
  return records.reduce((sum, record) => sum + Math.max(0, money(record.balance)), 0);
}

export function calculateCloseRate(records: MatterCommandRecord[]): number {
  if (!records.length) return 0;
  return calculateCompletedDeals(records) / records.length;
}

export function calculateAwaitingPayment(records: MatterCommandRecord[]): number {
  return records.filter((record) => lower(record.paymentStatus).includes("awaiting") || lower(record.paymentStatus).includes("unpaid") || lower(record.masterStatus) === "awaiting payment").length;
}

export function calculateStuck48h(records: MatterCommandRecord[], now = new Date()): number {
  return records.filter((record) => isStuck48h(record, now)).length;
}

export function calculateAverageCollectedDeal(records: MatterCommandRecord[]): number {
  const collected = records.filter((record) => money(record.amountCollected ?? record.amountPaid) > 0);
  if (!collected.length) return 0;
  return calculateCollectedRevenue(collected) / collected.length;
}

export function calculateCollectionRate(records: MatterCommandRecord[]): number {
  const quoted = records.reduce((sum, record) => sum + money(record.amountQuoted ?? record.quotedPrice), 0);
  if (quoted <= 0) return 0;
  return calculateCollectedRevenue(records) / quoted;
}

export function calculateCompletedDeals(records: MatterCommandRecord[]): number {
  return records.filter(isClosed).length;
}

export function calculateOpenDeals(records: MatterCommandRecord[]): number {
  return records.filter((record) => !isClosed(record)).length;
}

export function calculateRevenueAtRisk(records: MatterCommandRecord[]): number {
  return records.filter((record) => lower(record.delayRisk) === "high" || isStuck48h(record)).reduce((sum, record) => sum + money(record.balance), 0);
}

export function calculateCoreRevenueDeals(records: MatterCommandRecord[]): number {
  return records.filter((record) => CORE_LANES.has(record.lane ?? "")).length;
}

export function calculateStrategicDeals(records: MatterCommandRecord[]): number {
  return records.filter((record) => [record.dealType, record.serviceType, record.documentType, record.country].some((value) => /italy|citizenship|fbi|property|executive|international/i.test(value ?? ""))).length;
}

export function calculateHighestValueDeal(records: MatterCommandRecord[]): MatterCommandRecord | null {
  return records.reduce<MatterCommandRecord | null>((highest, record) => {
    if (!highest) return record;
    return money(record.finalPrice ?? record.amountQuoted ?? record.quotedPrice) > money(highest.finalPrice ?? highest.amountQuoted ?? highest.quotedPrice) ? record : highest;
  }, null);
}

export function calculateRevenueByLane(records: MatterCommandRecord[]): Record<string, number> {
  return records.reduce<Record<string, number>>((lanes, record) => {
    const lane = record.lane ?? "Unassigned";
    lanes[lane] = (lanes[lane] ?? 0) + money(record.amountCollected ?? record.amountPaid);
    return lanes;
  }, {});
}

export function classifyDealValueTier(amount: number | null | undefined): string {
  const value = money(amount);
  if (value >= 5000) return "Strategic";
  if (value >= 2000) return "Premium";
  if (value >= 1000) return "Core";
  if (value > 0) return "Entry";
  return "Unpriced";
}

export function detectAddonFlags(record: MatterCommandRecord): string | null {
  if (record.addonEvaluated) return null;
  const signal = [record.country, record.serviceType, record.documentType, record.shippingStatus, record.apostilleStatus, record.notes].join(" ");
  if (/international|courier|rush|urgent|apostille|shipping|translation/i.test(signal)) return "FLAG — ADDON NOT EVALUATED";
  return null;
}

export function getNextAction(record: MatterCommandRecord): string {
  if (money(record.balance) > 0 || /unpaid|awaiting/i.test(record.paymentStatus ?? "")) return "LOCKED_UNTIL_PAYMENT";
  if (detectAddonFlags(record)) return "Review add-on fit before quote/final packet";
  if (isStuck48h(record)) return "Operator follow-up required";
  return record.nextAction ?? "Continue controlled matter progression";
}

export function getExecutionLock(record: MatterCommandRecord): string {
  if (money(record.balance) > 0 || /unpaid|awaiting/i.test(record.paymentStatus ?? "")) return "LOCKED_UNTIL_PAYMENT";
  return record.executionLock ?? "UNLOCKED_BY_PAYMENT_GATE";
}

function isStuck48h(record: MatterCommandRecord, now = new Date()): boolean {
  if (isClosed(record)) return false;
  if (record.stuck48h) return true;
  if (!record.lastUpdated) return false;
  const updated = new Date(record.lastUpdated);
  if (Number.isNaN(updated.getTime())) return false;
  return now.getTime() - updated.getTime() > 48 * 60 * 60 * 1000;
}
