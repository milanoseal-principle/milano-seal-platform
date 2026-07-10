// Guardrails: banned public claims for the Founder Operating System.
// Nothing surfaced from this module may promise guaranteed outcomes, government
// approval, or legal/immigration advice. Used by the operator-facing safety
// panel (validator wiring is handled by the orchestrator).

export const BANNED_FOUNDER_CLAIMS: string[] = [
  "guaranteed acceptance",
  "guaranteed approval",
  "guaranteed revenue",
  "guaranteed profit",
  "guaranteed clients",
  "guaranteed leads",
  "government approved",
  "government-approved",
  "government endorsed",
  "legal advice",
  "immigration advice",
  "immigration services",
  "legal counsel",
  "acceptance guaranteed",
  "risk free",
  "risk-free",
];

// Returns the list of banned phrases found in the supplied text (case-insensitive).
export function containsBannedFounderClaim(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return BANNED_FOUNDER_CLAIMS.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );
}

// Convenience boolean guard.
export function isFounderClaimSafe(text: string): boolean {
  return containsBannedFounderClaim(text).length === 0;
}
