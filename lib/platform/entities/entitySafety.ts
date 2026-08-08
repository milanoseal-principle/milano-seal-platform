// Entity safety guards — enforce "no fabricated facts" across canonical entities.

import type { CanonicalEntityMeta } from "./index";

/** An unknown value must stay null/undefined — never a fabricated default. */
export function preserveUnknown<T>(value: T | null | undefined): T | null {
  return value === undefined || value === null ? null : value;
}

/** True if a record is flagged as internal sample data. */
export function isSample(meta: Pick<CanonicalEntityMeta, "isSample">): boolean {
  return meta.isSample === true;
}

/** Sample records must be excluded from KPI/actual aggregations. */
export function excludeSamples<T extends { isSample?: boolean }>(records: T[]): T[] {
  return records.filter((r) => r.isSample !== true);
}

/** Client-facing surfaces must never carry these internal fields. */
export const CLIENT_FORBIDDEN_FIELDS = [
  "margin",
  "internalNotes",
  "operatorNotes",
  "wisePayload",
  "storagePath",
  "partnerPayout",
  "trustScore",
] as const;

/** Returns any forbidden internal keys present on an object destined for a client surface. */
export function findClientForbiddenFields(obj: Record<string, unknown>): string[] {
  return CLIENT_FORBIDDEN_FIELDS.filter((k) => k in obj);
}
