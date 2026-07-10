// Partner verification model + helpers.
// Verification never guarantees future assignments. It only records whether an
// independent partner has cleared the required checks.

import type {
  PartnerVerification,
  VerificationCheck,
  VerificationResult,
} from "./types";

export const REQUIRED_CHECKS: VerificationCheck[] = [
  "identity",
  "credential",
  "background",
  "insurance",
  "sanctions",
];

// A check counts as cleared when passed or explicitly waived.
export function isCheckCleared(result: VerificationResult): boolean {
  return result === "passed" || result === "waived";
}

// Returns the list of verification checks that have cleared.
export function clearedChecks(v: PartnerVerification): VerificationCheck[] {
  return v.checks.filter((c) => isCheckCleared(c.result)).map((c) => c.type);
}

// A partner is fully verified only when every required check has cleared.
export function isFullyVerified(v: PartnerVerification): boolean {
  const cleared = new Set(clearedChecks(v));
  return REQUIRED_CHECKS.every((c) => cleared.has(c));
}

// Fraction (0-1) of required checks cleared.
export function verificationProgress(v: PartnerVerification): number {
  const cleared = new Set(clearedChecks(v));
  const hit = REQUIRED_CHECKS.filter((c) => cleared.has(c)).length;
  return REQUIRED_CHECKS.length === 0 ? 0 : hit / REQUIRED_CHECKS.length;
}

export function hasFailedCheck(v: PartnerVerification): boolean {
  return v.checks.some((c) => c.result === "failed");
}
