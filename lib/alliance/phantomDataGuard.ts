/**
 * Guards against phantom/demo reputation data appearing in production UI.
 * Any operator metric that cannot be traced to a real verified matter
 * must be hidden and replaced with "Insufficient verified history."
 */

export const INSUFFICIENT_HISTORY_LABEL = "Insufficient verified history";

export interface VerifiedMetric<T> {
  value: T;
  isVerified: boolean;
  matterCount: number;
}

/**
 * Returns the metric value if verified by a sufficient number of real matters,
 * otherwise returns null. UI should render INSUFFICIENT_HISTORY_LABEL on null.
 */
export function guardMetric<T>(
  metric: VerifiedMetric<T>,
  minMatters = 5,
): T | null {
  if (!metric.isVerified) return null;
  if (metric.matterCount < minMatters) return null;
  return metric.value;
}

/**
 * Format a guarded metric for display.
 * Returns the formatted string or "Insufficient verified history".
 */
export function displayMetric<T>(
  metric: VerifiedMetric<T> | null | undefined,
  format: (value: T) => string,
  minMatters = 5,
): string {
  if (!metric) return INSUFFICIENT_HISTORY_LABEL;
  const guarded = guardMetric(metric, minMatters);
  if (guarded === null) return INSUFFICIENT_HISTORY_LABEL;
  return format(guarded);
}

/**
 * Returns true if the metric is a stub/demo value that must be hidden.
 * Use this at render boundaries to prevent fake scores from showing.
 */
export function isPhantomData(metric: VerifiedMetric<unknown> | null | undefined): boolean {
  if (!metric) return true;
  if (!metric.isVerified) return true;
  if (metric.matterCount === 0) return true;
  return false;
}
