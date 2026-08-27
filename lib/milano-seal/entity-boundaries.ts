export const MILANO_SEAL_ENTITY_BOUNDARY_RULES = {
  allowed: [
    "notary",
    "RON",
    "apostille",
    "international document execution",
    "document coordination",
    "real estate document execution",
    "legal document support logistics",
    "identity verification",
    "execution QA",
    "custody tracking",
    "shipping/tracking",
    "quote/payment/scheduling",
  ],
  blocked: [
    "external legal intake workflow",
    "external case-recovery workflow",
    "external provider business development",
    "personal injury case routing",
    "accident attorney keywords",
    "external growth-system sales copy",
    "legal advice",
    "attorney representation language",
  ],
} as const;

export function getMilanoSealEntityForContent(text: string) {
  return isAllowedInMilanoSeal(text) ? "milano_seal" : "blocked_or_quarantined";
}

export function isAllowedInMilanoSeal(text: string) {
  const lower = text.toLowerCase();
  return !(MILANO_SEAL_ENTITY_BOUNDARY_RULES.blocked as readonly string[]).some((term) =>
    lower.includes(term.toLowerCase()),
  );
}

export function getMilanoSealBoundaryWarning(text: string) {
  return isAllowedInMilanoSeal(text)
    ? null
    : "Blocked from Milano Seal UI: outside entity or unsafe legal/support language.";
}

export function sanitizeMilanoSealCopy(text: string) {
  return (MILANO_SEAL_ENTITY_BOUNDARY_RULES.blocked as readonly string[]).reduce(
    (copy, term) => copy.replaceAll(term, "[blocked Milano Seal boundary term]"),
    text,
  );
}
