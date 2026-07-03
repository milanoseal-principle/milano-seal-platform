// Regulated / fingerprint / loan-signing manual-review rules. INTERNAL ONLY.
// These matters can never be auto-finalized; they require operator review.

import type { SmartPricingInput } from "./types";

export interface ManualReviewOutcome {
  manualReviewRequired: boolean;
  reasons: string[];
}

// Determine whether an intake requires manual review and why. Regulated
// professional use, any fingerprint route, and loan signing always require it.
export function evaluateManualReview(input: SmartPricingInput): ManualReviewOutcome {
  const reasons: string[] = [];

  if (input.regulatedUseCase) {
    reasons.push("Regulated professional use case requires operator review before quoting");
  }

  if (input.fingerprintUseCase) {
    reasons.push("Fingerprinting / FBI route requires agency instruction review");
    if (!input.oriProvided) {
      reasons.push("Agency instructions / ORI required before quote finalization");
    }
  }

  if (input.loanSigningNeeded) {
    reasons.push(
      "Package, title/escrow instructions, scan-back, and return requirements must be reviewed",
    );
  }

  if (input.translationNeeded === "unknown") {
    reasons.push("Translation sensitivity unresolved — quote cannot be finalized");
  }

  if (input.apostilleRequired && input.authenticationRequired) {
    reasons.push("Mixed state/federal authority — split route review required");
  }

  return { manualReviewRequired: reasons.length > 0, reasons };
}
