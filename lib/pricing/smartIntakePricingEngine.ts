import type { ExecutionLane, SmartPricingInput, SmartPricingResult } from "./types";
import { INTERNAL_BASES, PRICING_RULES } from "./pricingDoctrine";
import { recommendLane, laneBase } from "./laneRecommendation";
import { deriveComplexityFlags, scoreComplexity } from "./complexityScoring";
import { deriveAddOns } from "./addOnRules";
import { evaluateManualReview } from "./regulatedPricingRules";

function clampRange(base: number, pct = 0.25): [number, number] {
  const low = Math.round(base * (1 - pct));
  const high = Math.round(base * (1 + pct));
  return [low, high];
}

function publicLabelFor(lane: ExecutionLane): string {
  const labels = PRICING_RULES.publicLabels as Record<string, string>;
  return labels[lane] ?? labels.signature;
}

export function buildSmartIntakePricingResult(input: SmartPricingInput): SmartPricingResult {
  // Missing key info -> route review only, quote after review, no auto-draft.
  if (!input.documentType || !input.destinationCountry) {
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
      manualReviewReasons: ["Missing document type or destination country"],
      paymentGateRequired: true,
      schedulingLockedUntilPayment: true,
      quoteCanBeAutoDrafted: false,
      quoteRequiresFounderReview: false,
      publicDisplay: "Quote issued after review",
      operatorNotes: ["Route review required before a lane can be assigned."],
    };
  }

  const lane = recommendLane(input);
  const base = laneBase(lane);
  const pct = lane === "executive" ? 0.3 : 0.25;
  const operatorRange = base === null ? null : clampRange(base, pct);

  const flags = deriveComplexityFlags(input);
  const complexityScore = scoreComplexity(input, flags);
  const addOns = deriveAddOns(input);

  const { manualReviewRequired, reasons } = evaluateManualReview(input);
  const isRegulated = lane === "regulated_manual_review";

  const confidence = manualReviewRequired
    ? "manual_review_required"
    : complexityScore > 60
      ? "low"
      : "medium";

  return {
    suggestedLane: lane,
    publicLabel: publicLabelFor(lane),
    clientSafeSummary: "Your matter will be reviewed before a final quote is issued.",
    operatorInternalRange: isRegulated ? null : operatorRange,
    internalBase: isRegulated ? null : base,
    addOns,
    complexityScore,
    complexityFlags: flags,
    pricingConfidence: confidence,
    manualReviewRequired,
    manualReviewReasons: reasons,
    paymentGateRequired: true,
    schedulingLockedUntilPayment: true,
    // A quote can only be auto-drafted when no manual review is outstanding.
    quoteCanBeAutoDrafted: !manualReviewRequired,
    quoteRequiresFounderReview: complexityScore > 60 || manualReviewRequired,
    publicDisplay: "Quote issued after review",
    operatorNotes: reasons.length ? reasons : undefined,
  };
}

export default buildSmartIntakePricingResult;
