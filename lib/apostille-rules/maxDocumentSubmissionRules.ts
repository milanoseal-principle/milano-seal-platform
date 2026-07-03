export interface MaxSubmissionRule {
  authority: string;
  stateCode: string | null;
  documentType: string | null;
  deliveryMethod: string | null;
  appointmentType: string | null;
  maxDocumentsPerRequest: number | null;
  maxDocumentsPerAppointment: number | null;
  maxRequestsPerDay: number | null;
  sameDayLimit: number | null;
  mailLimit: number | null;
  expeditedLimit: number | null;
  paymentRule: string | null;
  returnEnvelopeRequired: boolean | null;
  sourceUrl: string | null;
  lastReviewedAt: string | null;
  confidence: "low" | "medium" | "high" | "manual_review_required";
  operatorNotes: string[];
  manualReviewRequired: boolean;
}

// NOTE: Submission limits require sourced, operator-reviewed data. Do NOT fabricate
// limits. This seed array is intentionally EMPTY until each rule can cite a sourceUrl.
export const MAX_SUBMISSION_RULES: MaxSubmissionRule[] = [];

export function evaluateMaxSubmission(rule: MaxSubmissionRule): MaxSubmissionRule {
  // No sourceUrl => manual review required; never assert an invented limit.
  const manualReviewRequired = !rule.sourceUrl ? true : rule.manualReviewRequired;
  return {
    ...rule,
    manualReviewRequired,
    confidence: !rule.sourceUrl ? "manual_review_required" : rule.confidence,
  };
}
