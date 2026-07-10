import type {
  RevenueRecord,
  RevenueReviewPeriod,
  FounderChannel,
  DataKind,
} from "./types";

// Pure revenue aggregation. Guards divide-by-zero. NEVER invents numbers — a
// null amount contributes 0 and is excluded from the count so averages stay
// honest. Marks a period `actualOnly` only when every record is actual.

const CHANNELS: FounderChannel[] = [
  "attorney",
  "partner",
  "government",
  "international",
  "direct",
];

function emptyByChannel(): Record<FounderChannel, number> {
  return {
    attorney: 0,
    partner: 0,
    government: 0,
    international: 0,
    direct: 0,
  };
}

// ISO week key, e.g. "2026-W28" (ISO-8601 week numbering).
export function isoWeekKey(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7; // Mon=0
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) -
        ((firstThursday.getUTCDay() + 6) % 7 - 3) / 7,
    );
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Month key, e.g. "2026-07".
export function monthKey(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function rollUpDataKind(kinds: DataKind[]): DataKind {
  if (kinds.length === 0) return "sample";
  if (kinds.every((k) => k === "actual")) return "actual";
  if (kinds.some((k) => k === "projection")) return "projection";
  return "sample";
}

function aggregate(
  periodKey: string,
  granularity: "weekly" | "monthly",
  records: RevenueRecord[],
): RevenueReviewPeriod {
  const byChannel = emptyByChannel();
  let total = 0;
  let count = 0;
  const kinds: DataKind[] = [];

  for (const r of records) {
    kinds.push(r.dataKind);
    const amount = typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : null;
    if (amount === null) continue;
    total += amount;
    count += 1;
    byChannel[r.channel] = (byChannel[r.channel] ?? 0) + amount;
  }

  // Divide-by-zero guard: average is 0 when there are no valued records.
  const average = count > 0 ? total / count : 0;

  return {
    periodKey,
    granularity,
    dataKind: rollUpDataKind(kinds),
    total,
    count,
    average,
    byChannel,
    actualOnly: kinds.length > 0 && kinds.every((k) => k === "actual"),
  };
}

function groupBy(
  records: RevenueRecord[],
  keyFn: (iso: string) => string | null,
): Map<string, RevenueRecord[]> {
  const map = new Map<string, RevenueRecord[]>();
  for (const r of records) {
    const key = keyFn(r.date);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(r);
    else map.set(key, [r]);
  }
  return map;
}

export function weeklyReview(records: RevenueRecord[]): RevenueReviewPeriod[] {
  const grouped = groupBy(records, isoWeekKey);
  return [...grouped.entries()]
    .map(([key, recs]) => aggregate(key, "weekly", recs))
    .sort((a, b) => (a.periodKey < b.periodKey ? 1 : -1));
}

export function monthlyReview(records: RevenueRecord[]): RevenueReviewPeriod[] {
  const grouped = groupBy(records, monthKey);
  return [...grouped.entries()]
    .map(([key, recs]) => aggregate(key, "monthly", recs))
    .sort((a, b) => (a.periodKey < b.periodKey ? 1 : -1));
}

// Total confirmed (actual) revenue on a given ISO date. Null-safe.
export function revenueOnDate(records: RevenueRecord[], date: string): number {
  return records
    .filter((r) => r.date === date && r.dataKind === "actual")
    .reduce(
      (sum, r) => sum + (typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : 0),
      0,
    );
}

export { CHANNELS };
