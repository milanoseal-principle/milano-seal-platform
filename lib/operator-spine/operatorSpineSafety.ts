const BLOCKED_TERMS = [
  "external case recovery",
  "external claimant workflow",
  "external provider business development",
  "external medical referral workflow",
  "personal injury routing",
  "demand recovery package",
  "outside employer intake",
] as const;

export function isOperatorSpinePublicSafe() {
  return false;
}

export function isOperatorSpineClientSafe() {
  return false;
}

export function isOperatorSpineAllianceSafe() {
  return false;
}

export function getBlockedOperatorSpineTerms() {
  return BLOCKED_TERMS;
}

export function sanitizeOperatorSpineCopy(copy = "") {
  return BLOCKED_TERMS.reduce(
    (safe, term) => safe.replace(new RegExp(term, "gi"), "[blocked source concept]"),
    copy,
  );
}
