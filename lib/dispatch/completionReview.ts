// Completion review model + helpers.
// A partner submits a completion checklist after finishing an accepted
// assignment. Submission never itself authorizes payment — see the payment
// queue, which requires founder approval.

import type { CompletionReview, ReviewOutcome } from "./types";

export function checklistProgress(review: CompletionReview): number {
  if (review.checklist.length === 0) return 0;
  const done = review.checklist.filter((c) => c.done).length;
  return done / review.checklist.length;
}

export function isChecklistComplete(review: CompletionReview): boolean {
  return review.checklist.length > 0 && review.checklist.every((c) => c.done);
}

// Ready for QA only when submitted with a fully completed checklist.
export function isReadyForQa(review: CompletionReview): boolean {
  return review.outcome === "pending" && isChecklistComplete(review);
}

export function outcomeLabel(outcome: ReviewOutcome): string {
  switch (outcome) {
    case "approved":
      return "Approved";
    case "revisions_requested":
      return "Revisions requested";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}
