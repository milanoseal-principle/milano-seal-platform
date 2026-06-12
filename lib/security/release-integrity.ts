// Release Integrity Controls
// Hard gates for final apostille/international document release.
// Complements lib/safety/final-release-checks.ts — this layer adds
// event definitions, Italian hard rule enforcement, and override logging.

export type ReleaseIntegrityEvent =
  | "FINAL_SEAL_REVIEW_STARTED"
  | "FINAL_SEAL_REVIEW_PASSED"
  | "FINAL_RELEASE_BLOCKED"
  | "FINAL_RELEASE_APPROVED"
  | "IDENTIFIER_MISMATCH_BLOCKED"
  | "IDENTIFIER_EXACT_MATCH_CONFIRMED"
  | "FOUNDER_RELEASE_OVERRIDE";

// Hard rule: final release requires ALL of these to be true.
export type ReleaseGateState = {
  paymentConfirmed: boolean;
  finalSealReviewPassed: boolean;
  identifierMatchPassed: boolean;
  pathwayReviewed: boolean;
  deliveryRecipientConfirmed: boolean;
  finalPdfLocked: boolean;
  founderApproved: boolean;
};

export type ReleaseGateResult = {
  canRelease: boolean;
  blockedReasons: string[];
  requiresFounderApproval: boolean;
};

// Evaluates whether all release gates are cleared.
export function evaluateReleaseGate(state: ReleaseGateState): ReleaseGateResult {
  const blocked: string[] = [];

  if (!state.paymentConfirmed)            blocked.push("Payment not confirmed");
  if (!state.finalSealReviewPassed)       blocked.push("Final Seal Review not passed");
  if (!state.identifierMatchPassed)       blocked.push("Identifier exact-match not confirmed");
  if (!state.pathwayReviewed)             blocked.push("Apostille / legalization pathway not reviewed");
  if (!state.deliveryRecipientConfirmed)  blocked.push("Delivery recipient not confirmed");
  if (!state.finalPdfLocked)             blocked.push("Final PDF not locked");
  if (!state.founderApproved)            blocked.push("Founder final approval not completed");

  return {
    canRelease: blocked.length === 0,
    blockedReasons: blocked,
    requiresFounderApproval: blocked.length > 0,
  };
}

// Italian matter hard rule: codice fiscale lock required.
// This check is separate from the general release gate and cannot be bypassed
// by any non-founder actor.
export function requiresCodiceFiscaleLockForRelease(
  destinationCountry: string | null | undefined
): boolean {
  return (destinationCountry ?? "").toLowerCase().includes("italy");
}

// Validates a founder override — actor must be founder_admin.
export function validateFounderReleaseOverride(params: {
  actorRole: string | null | undefined;
  reason: string | null | undefined;
  matterId: string | null | undefined;
}): { valid: boolean; rejectionReason: string | null } {
  if (params.actorRole !== "founder_admin") {
    return {
      valid: false,
      rejectionReason: "Release override requires founder administrator access.",
    };
  }
  if (!params.reason || params.reason.trim().length < 10) {
    return {
      valid: false,
      rejectionReason: "Override reason must be provided (minimum 10 characters).",
    };
  }
  if (!params.matterId) {
    return { valid: false, rejectionReason: "Matter ID is required for override." };
  }
  return { valid: true, rejectionReason: null };
}

// Client-safe release status labels — never exposes internal block reasons.
export function clientSafeReleaseStatus(canRelease: boolean): string {
  return canRelease
    ? "Your document has been released."
    : "Your document is undergoing final review before international release. No action is required from you right now.";
}

export const RELEASE_EVENT_LABELS: Record<ReleaseIntegrityEvent, string> = {
  FINAL_SEAL_REVIEW_STARTED:        "Final Seal Review started",
  FINAL_SEAL_REVIEW_PASSED:         "Final Seal Review passed",
  FINAL_RELEASE_BLOCKED:            "Final release blocked",
  FINAL_RELEASE_APPROVED:           "Final release approved",
  IDENTIFIER_MISMATCH_BLOCKED:      "Identifier mismatch — release blocked",
  IDENTIFIER_EXACT_MATCH_CONFIRMED: "Identifier exact-match confirmed",
  FOUNDER_RELEASE_OVERRIDE:         "Founder release override applied",
};
