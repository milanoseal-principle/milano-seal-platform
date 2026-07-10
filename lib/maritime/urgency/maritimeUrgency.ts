/**
 * maritimeUrgency — deadline/urgency evaluation. Never guarantees a deadline is
 * met; output frames everything as requested/operational/third-party-dependent.
 */

import type { MaritimeUrgencyLevel, MaritimeDeadlineType } from "@/lib/maritime/types";

export interface UrgencyInput {
  deadlineType?: MaritimeDeadlineType;
  hoursRemaining?: number | null;
  paymentConfirmed?: boolean;
  signerAuthorityVerified?: boolean;
  receivingAuthorityUncertain?: boolean;
}

export interface UrgencyResult {
  urgencyLevel: MaritimeUrgencyLevel;
  manualReviewRequired: boolean;
  founderReviewRequired: boolean;
  blocker: string | null;
  nextOperatorAction: string;
  deadlineFraming: "requested" | "operational" | "third_party";
}

export function evaluateUrgency(input: UrgencyInput): UrgencyResult {
  const h = input.hoursRemaining ?? null;

  // Uncertain receiving-authority requirements always force manual review.
  if (input.receivingAuthorityUncertain) {
    return {
      urgencyLevel: "manual_review",
      manualReviewRequired: true,
      founderReviewRequired: false,
      blocker: "Receiving-authority requirements unverified",
      nextOperatorAction: "verify_apostille_path",
      deadlineFraming: "third_party",
    };
  }

  let urgencyLevel: MaritimeUrgencyLevel = "standard";
  if (h !== null) {
    if (h <= 6) urgencyLevel = "critical_shipment";
    else if (h <= 24) urgencyLevel = "urgent";
    else if (h <= 72) urgencyLevel = "priority";
  }

  const blocker =
    input.paymentConfirmed === false
      ? "Payment not confirmed — scheduling locked"
      : input.signerAuthorityVerified === false
        ? "Signer authority not verified"
        : null;

  const nextOperatorAction = blocker
    ? input.paymentConfirmed === false
      ? "verify_payment"
      : "verify_signer_authority"
    : "review_document_readiness";

  return {
    urgencyLevel,
    manualReviewRequired: false,
    founderReviewRequired: urgencyLevel === "critical_shipment",
    blocker,
    nextOperatorAction,
    // A hard deadline supplied by the client is "requested"; we never guarantee it.
    deadlineFraming: "requested",
  };
}
