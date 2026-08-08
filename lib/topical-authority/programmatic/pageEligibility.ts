/**
 * pageEligibility — indexation state machine for programmatic pages. Only
 * `approved_indexable` pages enter the sitemap. No mass thin-page generation:
 * a page reaches `approved_indexable` only when the quality gate passes AND an
 * operator has approved it. Extends the existing Topical Authority engine.
 */

import { scorePageQuality, type PageQualityInput, type PageQualityResult } from "@/lib/topical-authority/programmatic/pageQualityScore";

export type IndexationState =
  | "draft"
  | "review_required"
  | "approved_indexable"
  | "approved_noindex"
  | "retired"
  | "redirected";

export interface ProgrammaticPage {
  slug: string;
  route: string;
  quality: PageQualityInput;
  operatorApproved: boolean;
  state?: IndexationState;
}

export interface EligibilityResult {
  slug: string;
  state: IndexationState;
  quality: PageQualityResult;
  inSitemap: boolean;
}

/** Resolve the indexation state from the quality gate + operator approval. */
export function resolveIndexation(page: ProgrammaticPage): EligibilityResult {
  const quality = scorePageQuality(page.quality);

  let state: IndexationState;
  if (!quality.indexable) {
    state = "review_required";
  } else if (!page.operatorApproved) {
    state = "review_required"; // passes gate but awaits human publish approval
  } else {
    state = "approved_indexable";
  }

  return {
    slug: page.slug,
    state,
    quality,
    inSitemap: state === "approved_indexable",
  };
}

/** Only approved-indexable pages are eligible for the sitemap. */
export function sitemapEligiblePages(pages: ProgrammaticPage[]): EligibilityResult[] {
  return pages.map(resolveIndexation).filter((r) => r.inSitemap);
}
