// AI & Secure Design Controls
// AI/LLM output is advisory only. AI cannot confirm compliance,
// confirm payment, alter identifiers, or release final documents.
// Human operator review is required before any AI output becomes
// a stored pathway recommendation or compliance decision.

export type AISafetyEvent =
  | "AI_INTAKE_PARSED"
  | "AI_RECOMMENDATION_REVIEW_REQUIRED"
  | "AI_IDENTIFIER_CHANGE_BLOCKED"
  | "AI_FINAL_RELEASE_DENIED";

// Hard rules enforced at call sites — AI output must never:
export const AI_HARD_RULES = [
  "AI cannot confirm compliance pathways.",
  "AI cannot confirm payment.",
  "AI cannot release final documents.",
  "AI cannot alter, shorten, or normalize foreign identifiers.",
  "AI cannot shorten or truncate codice fiscale.",
  "AI cannot generate apostille packages without human approval.",
  "AI output must be reviewed before storage as pathway recommendation.",
  "AI cannot override safety gates.",
  "AI cannot write PAYMENT_CONFIRMED or FINAL_RELEASE_APPROVED events.",
] as const;

// Validates that an AI-suggested identifier has not been altered from the source.
// Use before storing any AI-extracted identifier value.
export function validateAIIdentifierOutput(params: {
  sourceValue: string;
  aiSuggestedValue: string;
}): { safe: boolean; event: AISafetyEvent | null } {
  // Visual-strip only comparison (same rule as identifier-lock.ts)
  const src = params.sourceValue.replace(/\s+/g, "").trim();
  const ai  = params.aiSuggestedValue.replace(/\s+/g, "").trim();

  if (src !== ai) {
    return { safe: false, event: "AI_IDENTIFIER_CHANGE_BLOCKED" };
  }
  return { safe: true, event: null };
}

// Returns true if an AI recommendation is safe to store as advisory text.
// AI recommendations must be flagged for operator review before use.
export function markAIRecommendationForReview(output: {
  text: string;
  source: "intake_parse" | "pathway_suggestion" | "document_analysis";
}): { markedForReview: boolean; event: AISafetyEvent } {
  void output;
  return {
    markedForReview: true,
    event: "AI_RECOMMENDATION_REVIEW_REQUIRED",
  };
}

// Advisory-only wrapper — makes explicit that AI output is not a compliance decision.
export function wrapAsAdvisory(text: string): string {
  return `[Advisory — requires operator review] ${text}`;
}

// Blocks AI from calling final release actions.
export function blockAIFinalRelease(): {
  blocked: boolean;
  event: AISafetyEvent;
  reason: string;
} {
  return {
    blocked: true,
    event: "AI_FINAL_RELEASE_DENIED",
    reason:
      "AI cannot release final documents. Founder approval is required before international release.",
  };
}
