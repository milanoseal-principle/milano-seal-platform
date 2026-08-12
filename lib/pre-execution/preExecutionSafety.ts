/**
 * preExecutionSafety — the AI / compliance boundary for pre-execution intelligence.
 * AI may classify, extract, recommend, and score confidence. It may NOT make the
 * final compliance/execution/release determination — an operator confirms any
 * review-dependent decision. No legal/immigration advice. Milano Seal only.
 */

export const AI_MAY = [
  "classify",
  "identify",
  "extract",
  "recommend",
  "assign_confidence",
  "suggest_execution_playbook",
] as const;

export const AI_MAY_NOT = [
  "confirm_compliance_determination",
  "approve_execution",
  "authorize_release",
  "bypass_a_gate",
  "provide_legal_advice",
  "provide_immigration_advice",
  "guarantee_receiving_authority_acceptance",
] as const;

/** Any review-dependent AI output requires operator confirmation before it binds. */
export function requiresOperatorConfirmation(decisionType: string): boolean {
  const reviewDependent = new Set([
    "compliance_decision",
    "identity_determination",
    "seal_validation",
    "post_execution_qc",
    "apostille_readiness",
  ]);
  return reviewDependent.has(decisionType);
}

export const PRE_EXECUTION_SAFETY_NOTICE =
  "AI classifies and recommends; an operator confirms every review-dependent determination. No execution gate may be bypassed. Not legal or immigration advice; receiving-authority acceptance is never guaranteed.";
