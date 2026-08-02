/**
 * verticalIntelligenceSafety — guards for the Commercial OS. No fabricated
 * organizations, relationships, revenue, forecasts, or authority scores;
 * evidence-based only; internal data stays private.
 */

export const COMMERCIAL_BANNED_PUBLIC = [
  "guaranteed response",
  "guaranteed acceptance",
  "government approved",
  "airport approved",
  "port approved",
  "internal margin",
  "legal advice",
  "immigration advice",
  "medical advice",
] as const;

export function containsBannedCommercialPublic(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return COMMERCIAL_BANNED_PUBLIC.some((c) => t.includes(c));
}

/** Actual revenue for an organization = verified paid amounts only (never quotes). */
export function organizationRealRevenue(
  entries: { paid: boolean; amount: number; isSample?: boolean }[],
): number {
  return entries
    .filter((e) => e.paid === true && e.isSample !== true)
    .reduce((s, e) => s + (e.amount || 0), 0);
}

/** Forecast numbers are planning scenarios — never accounting/actual revenue. */
export const FORECAST_LABEL = "Weighted pipeline forecast · planning scenario · not actual revenue";
