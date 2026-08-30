export type AuthorityFreshnessStatus = "VERIFIED" | "REVIEW_DUE" | "STALE" | "SOURCE_CONFLICT" | "CHANGE_DETECTED" | "UNVERIFIED";
export interface AuthorityFreshnessInput { sourceReference?: string | null; verifiedAt?: string | null; reviewDueAt?: string | null; confidence?: string | null; sourceConflict?: boolean; changeDetected?: boolean }
export function deriveAuthorityFreshness(input: AuthorityFreshnessInput, now = new Date()): { status: AuthorityFreshnessStatus; routeReviewRequired: boolean; reason: string } {
  if (input.sourceConflict) return { status: "SOURCE_CONFLICT", routeReviewRequired: true, reason: "Conflicting authority evidence requires operator resolution." };
  if (input.changeDetected) return { status: "CHANGE_DETECTED", routeReviewRequired: true, reason: "Observed change requires verification before canonical routing changes." };
  if (!input.sourceReference || !input.verifiedAt || !input.reviewDueAt) return { status: "UNVERIFIED", routeReviewRequired: true, reason: "Current receiving-authority requirements require confirmation before execution." };
  const due = new Date(input.reviewDueAt); if (Number.isNaN(due.getTime())) return { status: "UNVERIFIED", routeReviewRequired: true, reason: "Review date is invalid." };
  if (due.getTime() < now.getTime()) return { status: "STALE", routeReviewRequired: true, reason: "Authority verification has expired." };
  const reviewWindow = 30 * 86_400_000; if (due.getTime() - now.getTime() <= reviewWindow) return { status: "REVIEW_DUE", routeReviewRequired: true, reason: "Authority review is due soon." };
  return { status: "VERIFIED", routeReviewRequired: false, reason: "Authority evidence remains within its recorded review window." };
}
