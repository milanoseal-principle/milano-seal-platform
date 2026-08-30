export const REVIEW_STATUSES = ['REQUESTED','ACKNOWLEDGED','IN_REVIEW','RESOLVED','CLOSED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const ALLOWED: Record<ReviewStatus, ReviewStatus[]> = {
  REQUESTED: ['ACKNOWLEDGED','CLOSED'],
  ACKNOWLEDGED: ['IN_REVIEW','CLOSED'],
  IN_REVIEW: ['RESOLVED','CLOSED'],
  RESOLVED: ['CLOSED','IN_REVIEW'],
  CLOSED: [],
};

export function canTransitionReview(from: ReviewStatus, to: ReviewStatus) {
  return ALLOWED[from].includes(to);
}

export function clientReviewLabel(status: ReviewStatus) {
  switch (status) {
    case 'REQUESTED': return 'MILANO REVIEW REQUESTED';
    case 'ACKNOWLEDGED': return 'MILANO EXECUTION DESK HAS ACKNOWLEDGED THIS REQUEST';
    case 'IN_REVIEW': return 'HUMAN REVIEW IN PROGRESS';
    case 'RESOLVED': return 'MILANO REVIEW RESOLVED';
    case 'CLOSED': return 'MILANO REVIEW CLOSED';
  }
}

export function normalizeReviewInput(input: Record<string, unknown>) {
  const question = String(input.question ?? '').trim();
  if (!question || question.length > 4000) throw new Error('INVALID_REVIEW_QUESTION');
  const text = (key: string, max = 200) => {
    const value = String(input[key] ?? '').trim();
    return value ? value.slice(0, max) : null;
  };
  return {
    matter_id: text('matter_id', 80),
    session_reference: text('session_reference', 160),
    country: text('country'),
    document_type: text('document_type'),
    origin: text('origin'),
    signer_posture: text('signer_posture'),
    question,
    safe_context: typeof input.safe_context === 'object' && input.safe_context && !Array.isArray(input.safe_context) ? input.safe_context : {},
  };
}
