import type { CountryDocumentSeoRecord } from "@/lib/seo/country-document/types";
import type { SeoEvidenceRecord } from "@/lib/seo/evidence/types";

export type SeoEditorialStatus = "DRAFT" | "REVIEW_REQUIRED" | "APPROVED" | "BLOCKED" | "STALE";
export interface SeoEditorialReview { status: SeoEditorialStatus; blocking_reasons?: string[] | null; evidence_snapshot?: unknown[] | null; review_due_at?: string | null }

export function evaluateCountryDocumentIndexability(record: CountryDocumentSeoRecord, evidence: SeoEvidenceRecord[], review: SeoEditorialReview | null | undefined, now = new Date()) {
  const reasons: string[] = [];
  if (!review) reasons.push("EDITORIAL_REVIEW_REQUIRED");
  else if (review.status !== "APPROVED") reasons.push(`EDITORIAL_${review.status}`);
  if (review?.blocking_reasons?.length) reasons.push("EDITORIAL_BLOCKERS_PRESENT");
  const requiredEvidence = record.evidenceIds.map((id) => evidence.find((item) => item.id === id));
  if (requiredEvidence.some((item) => !item)) reasons.push("REQUIRED_EVIDENCE_MISSING");
  for (const item of requiredEvidence) {
    if (!item) continue;
    if (item.status !== "VERIFIED") reasons.push(`EVIDENCE_${item.status}`);
    const due = new Date(item.reviewDueAt);
    if (Number.isNaN(due.getTime()) || due.getTime() < now.getTime()) reasons.push("EVIDENCE_STALE");
  }
  if (review?.review_due_at) {
    const reviewDue = new Date(review.review_due_at);
    if (Number.isNaN(reviewDue.getTime()) || reviewDue.getTime() < now.getTime()) reasons.push("EDITORIAL_REVIEW_STALE");
  }
  const requestedStatus = record.indexStatus;
  const allowed = requestedStatus === "INDEXABLE" && reasons.length === 0;
  return { allowed, requestedStatus, effectiveStatus: allowed ? "INDEXABLE" as const : "NOINDEX" as const, reasons: [...new Set(reasons)] };
}
