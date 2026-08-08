// Stage 3 — the one Milano Seal pricing truth for the intake path.
//
// Consumes a Stage 2 SmartIntakeClassification and produces one canonical
// commercial result. It NEVER fabricates a paid service and NEVER invents an
// unlocked amount — unresolved / mobile / apostille-only / government matters
// route to "quote after review", not a guessed total.
//
// Lane base values are REUSED from lib/pricing/pricingDoctrine (single source of
// truth). The public add-on canon (apostille +$250, rush +$400, additional
// signer +$150 each) is the locked consumer schedule. This module does not
// duplicate the pricing engine; it is the canonical intake entry into it.

import { INTERNAL_BASES } from "./pricingDoctrine";
import type { SmartIntakeClassification, ServiceState } from "../intake/smartClassification";

export type CommercialContext =
  | "consumer"
  | "professional_private"
  | "government"
  | "institutional"
  | "enterprise";

export type SuggestedLane =
  | "signature"
  | "priority"
  | "executive"
  | "apostille_only"
  | "authentication_only"
  | "regulated_manual_review"
  | "government_quote"
  | "enterprise_quote";

// Locked public consumer add-on canon (Nick × Tiff commercial architecture).
export const CONSUMER_ADD_ONS = { apostille: 250, rush: 400, additionalSigner: 150 } as const;
const LANE_BASE: Record<"signature" | "priority" | "executive", number> = {
  signature: INTERNAL_BASES.signature,
  priority: INTERNAL_BASES.priority,
  executive: INTERNAL_BASES.executive,
};

export interface MilanoPricingResult {
  commercialContext: CommercialContext;
  suggestedLane: SuggestedLane;
  laneBase: number | null;
  authorizedAddOns: { apostille?: number; rush?: number; additionalSigners?: number };
  /** Number of additional signers priced (max(0, signerCount-1)). */
  additionalSignerCount: number;
  /** Preserved for operator review; NOT multiplied into the +$250 add-on. */
  apostilleQuantity: number;
  total: number | null;
  manualReviewRequired: boolean;
  manualReviewReasons: string[];
  pricingConfidence: "high" | "medium" | "low" | "manual_review_required";
  clientDisplay:
    | { mode: "approved_price"; amount: number; summary: string }
    | { mode: "quote_after_review"; summary: string };
  paymentGateRequired: true;
  schedulingLockedUntilPayment: true;
}

export interface PricingTruthInput {
  classification: SmartIntakeClassification;
  commercialContext?: CommercialContext;
  /** Explicit client lane selection (Signature/Priority/Executive), if any. */
  selectedLane?: "signature" | "priority" | "executive";
}

const isRequired = (s: ServiceState) => s === "required";
// Only a CONTRADICTORY service forces review. An unmentioned service is
// "unknown" → simply not requested (not priced, not a blocker). Genuine gaps
// (e.g. undetermined apostille for an international destination) are surfaced by
// the classification's own manualReviewReasons.
const needsReview = (s: ServiceState) => s === "contradictory";

function reviewResult(
  ctx: CommercialContext,
  lane: SuggestedLane,
  reasons: string[],
  summary: string,
  apostilleQuantity: number,
): MilanoPricingResult {
  return {
    commercialContext: ctx,
    suggestedLane: lane,
    laneBase: null,
    authorizedAddOns: {},
    additionalSignerCount: 0,
    apostilleQuantity,
    total: null,
    manualReviewRequired: true,
    manualReviewReasons: reasons,
    pricingConfidence: "manual_review_required",
    clientDisplay: { mode: "quote_after_review", summary },
    paymentGateRequired: true,
    schedulingLockedUntilPayment: true,
  };
}

export function priceSmartIntake(input: PricingTruthInput): MilanoPricingResult {
  const c = input.classification;
  const ctx: CommercialContext = input.commercialContext ?? "consumer";
  const reasons = [...c.manualReviewReasons];

  // Government / institutional / enterprise never use the consumer lane schedule.
  if (ctx === "government" || ctx === "institutional" || ctx === "enterprise") {
    const lane: SuggestedLane = ctx === "enterprise" ? "enterprise_quote" : "government_quote";
    return reviewResult(ctx, lane, ["separate_procurement_pricing_model"], "Procurement quote issued after review.", c.apostilleQuantity);
  }

  // Any material price-driving service that is unknown/contradictory → review.
  for (const [name, state] of [
    ["notarization", c.notarization],
    ["apostille", c.apostille],
    ["authentication", c.authentication],
    ["translation", c.translation],
    ["mobile", c.mobile],
  ] as Array<[string, ServiceState]>) {
    if (needsReview(state)) reasons.push(`${name}_state_unresolved`);
  }

  // Mobile deployment is quoted by location/scope — never an invented fixed fee.
  if (isRequired(c.mobile)) reasons.push("mobile_deployment_quote_by_scope");
  // Authentication / non-Hague route has no locked consumer base.
  if (isRequired(c.authentication)) reasons.push("authentication_route_quote_after_review");
  // Translation is coordination; no locked flat consumer price.
  if (isRequired(c.translation)) reasons.push("translation_coordination_quote_after_review");

  // Does the matter need an execution lane (notarization/RON/mobile/signature)?
  const executionNeeded = isRequired(c.notarization) || isRequired(c.ron) || isRequired(c.mobile) || !!input.selectedLane;

  // Apostille-only (apostille required, no execution/notarization) — the base is
  // NOT canonically locked (doctrine has a 275–495 range, not a single value), so
  // refuse to invent $250-total or $750+$250. Route to review.
  if (!executionNeeded && isRequired(c.apostille)) {
    return reviewResult(ctx, "apostille_only", [...reasons, "apostille_only_base_not_canonically_locked"], "Apostille coordination quote issued after review.", c.apostilleQuantity);
  }

  // If nothing priceable is resolved yet, review.
  if (!executionNeeded && !reasons.length) {
    return reviewResult(ctx, "regulated_manual_review", ["insufficient_scope_to_auto_price"], "Your matter is ready for review. We'll confirm the execution route and quote.", c.apostilleQuantity);
  }

  // ── Auto-priceable consumer execution matter ──
  if (reasons.length > 0) {
    // Real execution scope exists but an add-on/service is unresolved → review.
    return reviewResult(ctx, input.selectedLane ?? "signature", reasons, "Your matter is ready for review. We'll confirm the final quote.", c.apostilleQuantity);
  }

  const lane = input.selectedLane ?? "signature";
  const laneBase = LANE_BASE[lane];

  const addOns: MilanoPricingResult["authorizedAddOns"] = {};
  if (isRequired(c.apostille)) addOns.apostille = CONSUMER_ADD_ONS.apostille; // flat coordination add-on; quantity preserved, NOT multiplied
  if (c.urgency === "urgent" || c.urgency === "same_day") addOns.rush = CONSUMER_ADD_ONS.rush;
  const additionalSignerCount = Math.max(0, c.signerCount - 1);
  if (additionalSignerCount > 0) addOns.additionalSigners = additionalSignerCount * CONSUMER_ADD_ONS.additionalSigner;

  const total = laneBase + (addOns.apostille ?? 0) + (addOns.rush ?? 0) + (addOns.additionalSigners ?? 0);

  const laneName = lane[0].toUpperCase() + lane.slice(1);
  const parts = [`${laneName} Execution`];
  if (addOns.apostille) parts.push("Apostille Coordination");
  if (addOns.rush) parts.push("Rush Processing");
  if (additionalSignerCount > 0) parts.push(`${additionalSignerCount} Additional Signer${additionalSignerCount > 1 ? "s" : ""}`);

  return {
    commercialContext: ctx,
    suggestedLane: lane,
    laneBase,
    authorizedAddOns: addOns,
    additionalSignerCount,
    apostilleQuantity: c.apostilleQuantity,
    total,
    manualReviewRequired: false,
    manualReviewReasons: [],
    pricingConfidence: "high",
    clientDisplay: { mode: "approved_price", amount: total, summary: parts.join(" + ") },
    paymentGateRequired: true,
    schedulingLockedUntilPayment: true,
  };
}
