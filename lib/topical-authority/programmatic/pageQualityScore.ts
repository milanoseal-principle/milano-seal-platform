/**
 * pageQualityScore — quality gate for programmatic (document × country) pages.
 * Prevents thin/doorway/mass-generated pages from ever being indexed. Extends the
 * existing Topical Authority engine; does not duplicate the country/document
 * registries — it evaluates a candidate page's content and evidence.
 */

import { containsBannedContentClaim } from "@/lib/topical-authority/contentSafety";

export interface PageQualityInput {
  /** Canonical, verified underlying records. */
  hasVerifiedDocumentRecord: boolean;
  hasVerifiedCountryRecord: boolean;
  /** Verified authority source count (official gov/HCCH/etc.). */
  authoritySourceCount: number;
  /** Substantive original body length (chars) — proxy for depth. */
  bodyLength: number;
  /** Distinct internal links to hubs/pillar/atlas/intake. */
  internalLinkCount: number;
  /** Country + document specific content present (not generic filler). */
  hasCountrySpecificContent: boolean;
  hasDocumentSpecificContent: boolean;
  hasRejectionRisks: boolean;
  hasConversionPath: boolean;
  /** Human editorial review completed. */
  humanReviewed: boolean;
  /** ISO date the compliance sources were last reviewed. */
  sourcesReviewedAtEpochDays: number | null;
  nowEpochDays: number;
  /** Rendered text used to scan for banned/guarantee claims. */
  renderedText: string;
  /** Another page already owns this exact primary intent. */
  duplicateIntent: boolean;
}

export interface PageQualityResult {
  score: number; // 0–100 (informational; blockers override)
  blockers: string[];
  indexable: boolean;
}

const MIN_BODY = 1200;
const MIN_LINKS = 4;
const SOURCE_STALE_DAYS = 365;

/** Deterministic quality evaluation. Any blocker => not indexable regardless of score. */
export function scorePageQuality(input: PageQualityInput): PageQualityResult {
  const blockers: string[] = [];

  if (!input.hasVerifiedDocumentRecord) blockers.push("no verified document record");
  if (!input.hasVerifiedCountryRecord) blockers.push("no verified country record");
  if (input.authoritySourceCount < 1) blockers.push("no verified authority source");
  if (input.bodyLength < MIN_BODY) blockers.push("thin content (below minimum body length)");
  if (input.internalLinkCount < MIN_LINKS) blockers.push("insufficient internal links");
  if (!input.hasCountrySpecificContent || !input.hasDocumentSpecificContent) blockers.push("not document+country specific (doorway risk)");
  if (!input.hasRejectionRisks) blockers.push("missing rejection-risk value");
  if (!input.hasConversionPath) blockers.push("no conversion path");
  if (!input.humanReviewed) blockers.push("human review not completed");
  if (input.duplicateIntent) blockers.push("duplicate primary intent (cannibalization)");
  if (containsBannedContentClaim(input.renderedText)) blockers.push("unsupported/guaranteed claim present");

  // Stale sources: allowed to remain informational, but not freshly indexable.
  if (input.sourcesReviewedAtEpochDays === null || input.nowEpochDays - input.sourcesReviewedAtEpochDays > SOURCE_STALE_DAYS) {
    blockers.push("compliance sources stale — requires review before indexation");
  }

  // Informational score (does not override blockers).
  let score = 0;
  score += Math.min(30, (input.bodyLength / MIN_BODY) * 20);
  score += Math.min(20, input.authoritySourceCount * 8);
  score += Math.min(20, input.internalLinkCount * 3);
  score += input.hasRejectionRisks ? 10 : 0;
  score += input.hasCountrySpecificContent && input.hasDocumentSpecificContent ? 10 : 0;
  score += input.humanReviewed ? 10 : 0;

  return {
    score: Math.round(Math.min(100, score)),
    blockers,
    indexable: blockers.length === 0,
  };
}
