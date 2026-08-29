export type SeoEvidenceAuthority = "HCCH" | "US_STATE_DEPARTMENT" | "FLORIDA_DOS" | "STATE_COMPETENT_AUTHORITY" | "FEDERAL_AUTHORITY" | "RECEIVING_AUTHORITY";
export interface SeoEvidenceRecord {
  id: string;
  authority: SeoEvidenceAuthority;
  sourceUrl: string;
  sourceTitle: string;
  countrySlugs: string[];
  documentSlugs: string[];
  verifiedAt: string;
  reviewDueAt: string;
  status: "VERIFIED" | "REVIEW_DUE" | "STALE" | "SUPERSEDED";
  notes?: string;
}
