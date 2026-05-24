/**
 * Strips internal fields from deal records before they reach client-visible
 * surfaces. Add any new internal-only columns here as the schema evolves.
 */

// Fields that must never reach client-facing API responses or partner views
const BLOCKED_FIELDS = [
  "internal_notes",
  "platform_margin",
  "operator_cost",
  "vendor_cost",
  "admin_notes",
  "risk_flags",
  "fraud_signals",
] as const;

type BlockedField = (typeof BLOCKED_FIELDS)[number];

export type WithoutInternal<T> = Omit<T, BlockedField>;

/**
 * Returns a copy of `record` with all internal fields removed.
 * Safe to call on any object — unknown keys are ignored.
 */
export function stripInternalFields<T extends Record<string, unknown>>(
  record: T
): WithoutInternal<T> {
  const result = { ...record };
  for (const field of BLOCKED_FIELDS) {
    delete result[field];
  }
  return result as WithoutInternal<T>;
}

/**
 * Applies `stripInternalFields` to every item in an array.
 */
export function stripInternalFieldsFromList<T extends Record<string, unknown>>(
  records: T[]
): WithoutInternal<T>[] {
  return records.map(stripInternalFields);
}

/**
 * Returns true if `fieldName` is a protected internal field.
 * Use at API boundaries to block clients from selecting internal columns.
 */
export function isBlockedField(fieldName: string): boolean {
  return (BLOCKED_FIELDS as readonly string[]).includes(fieldName);
}
