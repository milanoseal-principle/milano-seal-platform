// Stage 3 tail — role-safe projections of ONE canonical pricing result.
//
// intake/portal render projectClientPricing; operator surfaces render
// projectOperatorPricing; founder renders projectFounderPricing. All three read
// the SAME MilanoPricingResult, so the underlying commercial result never
// changes — only visibility does. The intake UI must consume projectClientPricing
// and never compute a price itself.

import type { MilanoPricingResult } from "./milanoPricingTruth";

export interface ClientPricingProjection {
  mode: "approved_price" | "quote_after_review";
  /** Present only for approved_price. */
  amount?: number;
  summary: string;
  paymentGateRequired: true;
  schedulingLockedUntilPayment: true;
}

/**
 * Client-safe projection. Exposes ONLY the approved amount + human summary or a
 * quote-after-review state. Never exposes manualReviewReasons, pricingConfidence
 * enums, lane internals, add-on mechanics, or any cost/margin.
 */
export function projectClientPricing(r: MilanoPricingResult): ClientPricingProjection {
  if (r.clientDisplay.mode === "approved_price") {
    return {
      mode: "approved_price",
      amount: r.clientDisplay.amount,
      summary: r.clientDisplay.summary,
      paymentGateRequired: true,
      schedulingLockedUntilPayment: true,
    };
  }
  return {
    mode: "quote_after_review",
    summary: r.clientDisplay.summary,
    paymentGateRequired: true,
    schedulingLockedUntilPayment: true,
  };
}

export interface OperatorPricingProjection {
  suggestedLane: MilanoPricingResult["suggestedLane"];
  laneBase: number | null;
  authorizedAddOns: MilanoPricingResult["authorizedAddOns"];
  additionalSignerCount: number;
  apostilleQuantity: number;
  total: number | null;
  manualReviewRequired: boolean;
  manualReviewReasons: string[];
  pricingConfidence: MilanoPricingResult["pricingConfidence"];
}

/** Operator projection — pricing mechanics + review triggers (no margin/cost). */
export function projectOperatorPricing(r: MilanoPricingResult): OperatorPricingProjection {
  return {
    suggestedLane: r.suggestedLane,
    laneBase: r.laneBase,
    authorizedAddOns: r.authorizedAddOns,
    additionalSignerCount: r.additionalSignerCount,
    apostilleQuantity: r.apostilleQuantity,
    total: r.total,
    manualReviewRequired: r.manualReviewRequired,
    manualReviewReasons: r.manualReviewReasons,
    pricingConfidence: r.pricingConfidence,
  };
}

/** Founder projection — the full canonical result. */
export function projectFounderPricing(r: MilanoPricingResult): MilanoPricingResult {
  return r;
}
