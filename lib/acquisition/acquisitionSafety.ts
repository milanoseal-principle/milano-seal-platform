// Compliance guardrail for acquisition-facing copy. Detects banned claims so
// marketing/CTA text can be screened before it ships. Pure — no I/O.

export const BANNED_ACQUISITION_CLAIMS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bguarantee(d|s)?\s+(outcome|result|success)\b/i, label: "guaranteed outcome" },
  { pattern: /\bguarantee(d|s)?\s+accept(ance|ed)\b/i, label: "guaranteed acceptance" },
  { pattern: /\bacceptance\s+guarantee(d)?\b/i, label: "guaranteed acceptance" },
  { pattern: /\bgovernment[- ]approved\b/i, label: "government approved" },
  { pattern: /\bapproved\s+by\s+the\s+government\b/i, label: "government approved" },
  { pattern: /\blegal\s+advice\b/i, label: "legal advice" },
  { pattern: /\bimmigration\s+advice\b/i, label: "immigration advice" },
  { pattern: /\bwe\s+guarantee\b/i, label: "guarantee" },
  { pattern: /\b100%\s+(approval|acceptance|success|guaranteed)\b/i, label: "guaranteed outcome" },
  // Fabricated social-proof counts, e.g. "trusted by 10,000 clients".
  { pattern: /\b(trusted|used|chosen)\s+by\s+[\d,]+\+?\s+(clients|customers|attorneys|firms|users)\b/i, label: "fabricated client count" },
  { pattern: /\b[\d,]{2,}\+?\s+(clients|customers|matters)\s+served\b/i, label: "fabricated client count" },
];

/**
 * Return the list of banned-claim labels found in the given text.
 * Empty array means the text passed the screen.
 */
export function containsBannedAcquisitionClaim(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const { pattern, label } of BANNED_ACQUISITION_CLAIMS) {
    if (pattern.test(text)) found.add(label);
  }
  return Array.from(found);
}
