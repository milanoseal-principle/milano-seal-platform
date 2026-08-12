/**
 * revenueSafety — guards for the Revenue Stack. Actual revenue requires a
 * verified payment event; quotes and planning scenarios are never actual revenue
 * and must be labelled; internal margins never public.
 */

export const PLANNING_SCENARIO_LABEL = "Internal planning scenario · Not actual revenue · Not guaranteed";

/** Actual revenue is ONLY the sum of verified paid amounts — never quotes. */
export function actualRevenue(entries: { paid: boolean; amount: number; isSample?: boolean }[]): number {
  return entries
    .filter((e) => e.paid === true && e.isSample !== true)
    .reduce((sum, e) => sum + (e.amount || 0), 0);
}

/** Quoted value is explicitly NOT paid revenue. */
export function quotedValue(entries: { amount: number; isSample?: boolean }[]): number {
  return entries.filter((e) => e.isSample !== true).reduce((s, e) => s + (e.amount || 0), 0);
}

export const REVENUE_BANNED_PUBLIC = [
  "guaranteed acceptance",
  "guaranteed savings",
  "government approved",
  "internal margin",
  "partner payout",
] as const;

export function containsBannedRevenuePublic(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return REVENUE_BANNED_PUBLIC.some((c) => t.includes(c));
}
