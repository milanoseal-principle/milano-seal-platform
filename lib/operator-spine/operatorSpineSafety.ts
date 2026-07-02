const BLOCKED_TERMS = ["PIP", "claimant", "carrier", "DOL", "demand package", "provider BD", "Demesmin", "Dover", "accident attorney", "personal injury", "medical-legal", "chiropractor", "PIP suit"] as const;
export function isOperatorSpinePublicSafe() { return false; }
export function isOperatorSpineClientSafe() { return false; }
export function isOperatorSpineAllianceSafe() { return false; }
export function getBlockedOperatorSpineTerms() { return BLOCKED_TERMS; }
export function sanitizeOperatorSpineCopy(copy = "") { return BLOCKED_TERMS.reduce((safe, term) => safe.replace(new RegExp(term, "gi"), "[blocked source concept]"), copy); }
