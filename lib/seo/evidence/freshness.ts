import type { SeoEvidenceRecord } from "./types";
export function getFreshnessStatus(record: SeoEvidenceRecord, now = new Date()): SeoEvidenceRecord["status"] {
  if (record.status === "SUPERSEDED") return "SUPERSEDED";
  return new Date(record.reviewDueAt).getTime() < now.getTime() ? "REVIEW_DUE" : record.status;
}
export const requiresReview = (record: SeoEvidenceRecord, now?: Date) => getFreshnessStatus(record, now) !== "VERIFIED";
