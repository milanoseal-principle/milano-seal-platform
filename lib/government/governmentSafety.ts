// Guardrails: banned public claims for the government / public-sector vertical.
// Used by the validator and by the operator-facing safety panel.

export const BANNED_GOVERNMENT_CLAIMS: string[] = [
  "government approved",
  "government-approved",
  "guaranteed contract",
  "guaranteed procurement",
  "guaranteed award",
  "guaranteed acceptance",
  "official county partner",
  "official agency partner",
  "official government partner",
  "legal advice",
  "guaranteed registration",
];

// Returns the list of banned phrases found in the supplied text (case-insensitive).
export function containsBannedGovernmentClaim(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return BANNED_GOVERNMENT_CLAIMS.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );
}
