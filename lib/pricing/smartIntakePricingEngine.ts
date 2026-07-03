import type { SmartPricingInput, SmartPricingResult } from "./types";
import { INTERNAL_BASES, PRICING_RULES } from "./pricingDoctrine";

function clampRange(base: number, pct = 0.25): [number, number] {
  const low = Math.round(base * (1 - pct));
  const high = Math.round(base * (1 + pct));
  return [low, high];
}

export function buildSmartIntakePricingResult(input: SmartPricingInput): SmartPricingResult {
  const flags: string[] = [];
  let suggested: any = "signature";
  let internalBase: number | null = null;
  let operatorRange: [number, number] | null = null;
  let manualReview = false;
  const manualReasons: string[] = [];

  if (!input.documentType || !input.destinationCountry) {
    manualReview = true;
    manualReasons.push("Missing document type or destination country");
    return {
      suggestedLane: "route_review_only",
      publicLabel: PRICING_RULES.publicLabels.route_review_only,
      clientSafeSummary: "Quote issued after review",
      operatorInternalRange: [INTERNAL_BASES.route_review_min, INTERNAL_BASES.route_review_max],
      internalBase: INTERNAL_BASES.route_review_min,
      addOns: {},
      complexityScore: 10,
      complexityFlags: ["manual_review"],
      pricingConfidence: "manual_review_required",
      manualReviewRequired: true,
      manualReviewReasons: manualReasons,
      paymentGateRequired: true,
      schedulingLockedUntilPayment: true,
      quoteCanBeAutoDrafted: false,
      quoteRequiresFounderReview: false,
      publicDisplay: "Quote issued after review",
    };
  }

  const docCount = input.documentCount || 1;
  const signerCount = input.signerCount || 1;

  if (docCount === 1 && signerCount === 1 && !input.regulatedUseCase && !input.apostilleRequired && !input.professionalIntermediary && !input.urgency) {
    suggested = "signature";
    internalBase = INTERNAL_BASES.signature;
    operatorRange = clampRange(internalBase, 0.25);
  } else if (docCount > 1 || input.apostilleRequired || input.professionalIntermediary) {
    suggested = "priority";
    internalBase = INTERNAL_BASES.priority;
    operatorRange = clampRange(internalBase, 0.25);
  }

  if (input.urgency === "urgent" || input.urgency === "same_day" || input.regulatedUseCase || input.professionalIntermediary || input.destinationCountry === "unknown") {
    suggested = "executive";
    internalBase = INTERNAL_BASES.executive;
    operatorRange = clampRange(internalBase, 0.3);
  }

  if (input.fingerprintUseCase) {
    manualReview = true;
    manualReasons.push("Fingerprinting or FBI route requires agency instruction review");
  }

  if (input.loanSigningNeeded) {
    manualReview = true;
    manualReasons.push("Loan signing packages require title/escrow and scan-back review");
  }

  if (input.authenticationRequired && input.documentCount && input.documentCount > 1 && input.originJurisdiction && input.originJurisdiction !== "same") {
    flags.push("mixed_state_federal");
    manualReview = true;
  }

  const complexityScore = Math.min(100, (docCount * 5) + (signerCount * 2) + (manualReview ? 30 : 0));

  const result: SmartPricingResult = {
    suggestedLane: suggested,
    publicLabel: PRICING_RULES.publicLabels[suggested] || PRICING_RULES.publicLabels.signature,
    clientSafeSummary: "Your matter will be reviewed before a final quote is issued.",
    operatorInternalRange: operatorRange,
    internalBase,
    addOns: {},
    complexityScore,
    complexityFlags: flags as any,
    pricingConfidence: manualReview ? "manual_review_required" : "medium",
    manualReviewRequired: manualReview,
    manualReviewReasons: manualReasons,
    paymentGateRequired: true,
    schedulingLockedUntilPayment: true,
    quoteCanBeAutoDrafted: !manualReview,
    quoteRequiresFounderReview: complexityScore > 60,
    publicDisplay: "Quote issued after review",
  };

  return result;
}

export default buildSmartIntakePricingResult;
