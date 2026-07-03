// Client-facing pricing projection. Returns ONLY copy/detail — no exact prices,
// no internal add-ons, no margin. This is what the intake/portal may show.

import type { SmartPricingResult } from "./types";

export interface ClientPricingProjection {
  likelyExecutionPath: string;
  whatWillBeReviewed: string[];
  quoteNote: string;
  paymentGatedSchedulingNote: string;
  cta: string;
}

// Project a client-safe view from the internal pricing result. Deliberately
// omits internalBase, operatorInternalRange, and addOns.
export function projectClientPricing(result: SmartPricingResult): ClientPricingProjection {
  return {
    likelyExecutionPath: result.publicLabel,
    whatWillBeReviewed: [
      "Document type and issuing authority",
      "Origin jurisdiction and signer location",
      "Destination country and receiving authority",
      "Apostille / authentication route",
      "Translation sensitivity",
      "Urgency and final packet requirements",
    ],
    quoteNote: "Quote issued after review.",
    paymentGatedSchedulingNote:
      "Execution is not scheduled until the quote is reviewed, accepted, and payment is confirmed.",
    cta: "Submit for Execution Quote",
  };
}
