// Jurisdiction safety guard. Prevents banned claims from surfacing in any
// jurisdiction-facing copy: guaranteed acceptance, government-approval claims,
// and legal/immigration advice. Country data is operational only and must be
// verified before execution.

export const VERIFY_BEFORE_EXECUTION_CAPTION =
  "Verify before execution — illustrative jurisdiction data, not legal advice.";

const BANNED_CLAIM_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\bguarantee(?:d|s)?\s+(?:acceptance|approval|success)\b/i,
    reason: "guaranteed acceptance/approval claim",
  },
  {
    pattern: /\b(?:100%|always)\s+(?:accepted|approved)\b/i,
    reason: "absolute acceptance claim",
  },
  {
    pattern: /\bgovernment[-\s]?approved\b/i,
    reason: "government-approval claim",
  },
  {
    pattern: /\b(?:approved|endorsed|certified)\s+by\s+the\s+government\b/i,
    reason: "government endorsement claim",
  },
  {
    pattern: /\bofficially\s+(?:approved|endorsed|sanctioned)\b/i,
    reason: "official-approval claim",
  },
  {
    pattern: /\blegal\s+advice\b/i,
    reason: "legal advice",
  },
  {
    pattern: /\bimmigration\s+advice\b/i,
    reason: "immigration advice",
  },
  {
    pattern: /\bwe\s+(?:can\s+)?guarantee\b/i,
    reason: "guarantee claim",
  },
];

export interface BannedClaimResult {
  banned: boolean;
  reasons: string[];
}

export function detectBannedJurisdictionClaims(
  text: string | null | undefined,
): BannedClaimResult {
  if (!text) return { banned: false, reasons: [] };
  const reasons: string[] = [];
  for (const { pattern, reason } of BANNED_CLAIM_PATTERNS) {
    if (pattern.test(text) && !reasons.includes(reason)) {
      reasons.push(reason);
    }
  }
  return { banned: reasons.length > 0, reasons };
}

export function containsBannedJurisdictionClaim(
  text: string | null | undefined,
): boolean {
  return detectBannedJurisdictionClaims(text).banned;
}

// Guard helper: throws in development if banned copy is passed. In production
// it returns the text unchanged after logging, so a single bad string never
// crashes an operator page.
export function assertSafeJurisdictionCopy(text: string): string {
  const result = detectBannedJurisdictionClaims(text);
  if (result.banned) {
    const msg = `Banned jurisdiction claim detected: ${result.reasons.join(", ")}`;
    if (process.env.NODE_ENV === "development") {
      throw new Error(msg);
    }
    // eslint-disable-next-line no-console
    console.warn(`[jurisdictionSafety] ${msg}`);
  }
  return text;
}
