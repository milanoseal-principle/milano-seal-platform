// Guardrails: banned claims for the Alliance Dispatch Network.
// Partners are independent contractors. No guaranteed assignments, no
// guaranteed income, and no employment-relationship language anywhere.

export const BANNED_DISPATCH_CLAIMS: string[] = [
  "guaranteed assignment",
  "guaranteed assignments",
  "guaranteed income",
  "guaranteed pay",
  "guaranteed work",
  "guaranteed hours",
  "steady paycheck",
  "you are our employee",
  "full-time employee",
  "part-time employee",
  "employment offer",
  "job offer",
  "government approved",
  "government-approved",
  "guaranteed acceptance",
];

// Returns the banned phrases found in the supplied text (case-insensitive).
export function containsBannedDispatchClaim(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return BANNED_DISPATCH_CLAIMS.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );
}

export const DISPATCH_OPERATOR_RULES: string[] = [
  "Partners are independent contractors — never use employment language.",
  "No guaranteed assignments and no guaranteed income to any partner.",
  "Assignments are offers a partner may accept or decline.",
  "Partners never see internal notes, margins, or unrelated matters.",
  "Partner payments are a tracking queue and require founder approval.",
  "No government-approved or guaranteed-acceptance claims.",
];
