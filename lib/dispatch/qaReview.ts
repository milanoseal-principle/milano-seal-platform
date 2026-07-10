// QA review model + helpers.
// Internal quality assurance of completed work. Internal notes are never shown
// to the partner. A passing QA review does not by itself release payment —
// partner payouts always require founder approval.

import type { QaReview, ReviewOutcome } from "./types";

export const QA_PASS_THRESHOLD = 70;

export function qaOutcomeFromScore(score: number): ReviewOutcome {
  if (score >= 85) return "approved";
  if (score >= QA_PASS_THRESHOLD) return "revisions_requested";
  return "rejected";
}

export function averageQaScore(reviews: QaReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.score, 0);
  return Math.round(total / reviews.length);
}

// Passing reviews eligible to be queued for payment tracking (still needs
// founder approval downstream).
export function passingReviews(reviews: QaReview[]): QaReview[] {
  return reviews.filter((r) => r.outcome === "approved");
}

// Partner-safe view — strips internal notes before anything partner-facing.
export function toPartnerSafe(review: QaReview): Omit<QaReview, "internalNotes"> {
  const { internalNotes: _internalNotes, ...safe } = review;
  return safe;
}
