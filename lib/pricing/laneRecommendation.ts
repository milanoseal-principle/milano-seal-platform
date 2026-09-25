// Lane recommendation for Smart Intake. INTERNAL ONLY.

import type { ExecutionLane, SmartPricingInput } from "./types";
import { INTERNAL_BASES } from "./pricingDoctrine";

// Recommend an execution lane from intake signals. Mirrors the Smart Intake
// rules: missing key info -> route review; simple -> signature; multi/apostille/
// intermediary -> priority; urgent/high-value/mixed authority/regulated -> executive.
export function recommendLane(input: SmartPricingInput): ExecutionLane {
  if (!input.documentType || !input.destinationCountry) {
    return "route_review_only";
  }

  const docCount = input.documentCount ?? 1;
  const signerCount = input.signerCount ?? 1;
  const mixedAuthority = Boolean(input.apostilleRequired && input.authenticationRequired);
  const highValue =
    input.documentFamily === "business_corporate" || input.clientType === "attorney";
  const urgent = input.urgency === "urgent" || input.urgency === "same_day";

  if (input.regulatedUseCase || input.fingerprintUseCase || input.loanSigningNeeded) {
    return "regulated_manual_review";
  }

  if (urgent || highValue || mixedAuthority || input.clientType === "immigration") {
    return "executive";
  }

  if (docCount > 1 || input.apostilleRequired || input.professionalIntermediary) {
    return "priority";
  }

  if (docCount === 1 && signerCount === 1) {
    return "signature";
  }

  return "priority";
}

export function laneBase(lane: ExecutionLane): number | null {
  switch (lane) {
    case "signature":
      return INTERNAL_BASES.signature;
    case "priority":
      return INTERNAL_BASES.priority;
    case "executive":
      return INTERNAL_BASES.executive;
    case "route_review_only":
      // Route review has no canonical base; the quote is issued after review.
      return null;
    default:
      return null;
  }
}
