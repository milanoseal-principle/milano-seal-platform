import type { CountryDocumentSeoRecord } from "@/lib/seo/country-document/types";
export interface SeoGovernanceEvidence { id: string; status: "VERIFIED" | "MISSING" | "STALE" | "CONFLICT" | "REVIEW_REQUIRED" }
export function evaluateCountryDocumentIndexability(record: CountryDocumentSeoRecord, evidence: SeoGovernanceEvidence[]) {
  const reasons: string[] = [...(record.blockingReasons ?? [])]; const byId = new Map(evidence.map((item) => [item.id, item]));
  if (record.reviewStatus !== "APPROVED") reasons.push(`Editorial status is ${record.reviewStatus}`);
  for (const id of record.requiredEvidenceIds ?? []) { const item = byId.get(id); if (!item) reasons.push(`Missing evidence: ${id}`); else if (item.status !== "VERIFIED") reasons.push(`Evidence ${id} is ${item.status}`); }
  if (!record.destination?.slug) reasons.push("Canonical country missing"); if (!record.document?.slug) reasons.push("Canonical document missing");
  const allowed = record.indexStatus === "INDEXABLE" && record.reviewStatus === "APPROVED" && reasons.length === 0;
  return { allowed, requestedStatus: record.indexStatus, effectiveStatus: allowed ? "INDEXABLE" as const : "NOINDEX" as const, reasons };
}
