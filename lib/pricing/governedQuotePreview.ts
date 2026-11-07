// INTERNAL ONLY — the single governed quote projection shared by the operator
// preview (app/api/pricing/quote) and the server-side Matter quote commit
// (app/api/deals/[id]/quote). It composes, in order:
//
//   1. canonical execution truth (lib/matter/executionTruth)
//   2. destination × document route intelligence
//   3. governed pricing facts
//   4. projectCanonicalQuote()
//
// There is no second pricing engine and no second routing engine here. Route
// facts can only ADD review triggers; a browser-supplied flag or a
// browser-supplied route_intelligence object can never clear one.

import {
  executionQuoteReviewReasons,
  executionTruthToLegacy,
  normalizeExecutionTruth,
  type CanonicalExecutionTruth,
} from "@/lib/matter/executionTruth";
import {
  projectCanonicalQuote,
  type CanonicalQuoteProjection,
} from "./canonicalQuoteOrchestrator";
import {
  projectQuoteRouteIntelligence,
  type QuoteRouteIntelligence,
} from "./destinationDocumentQuoteIntelligence";

// Keys a caller may send but the server always recomputes. Stripping them keeps
// preview/commit parity and prevents a browser from asserting a projection.
const SERVER_PROJECTED_KEYS = [
  "route_intelligence",
  "routeIntelligence",
  "review_required",
  "review_reasons",
  "reviewRequired",
  "reviewReasons",
  "pricing_guards",
  "breakdown",
  "total",
  "subtotal",
  "deposit_amount",
  "balance_due",
  "discount_amount",
] as const;

const asBool = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

export interface GovernedQuoteRouteIntelligenceView {
  destination: string;
  documentCategory: QuoteRouteIntelligence["documentCategory"];
  routeType: QuoteRouteIntelligence["routeType"];
  routeLabel: string;
  authorityStatus: string;
  reviewRequired: boolean;
  reviewReasons: string[];
  safetyNotice: string;
  acceptanceNotice: string;
  issuingLane: QuoteRouteIntelligence["issuingLane"];
  federalAgency: string | null;
  receivingAuthorityType: QuoteRouteIntelligence["receivingAuthorityType"];
  authorityPath: string[];
  advisories: string[];
}

export interface GovernedQuotePreview {
  matter_base: CanonicalQuoteProjection["matterBase"] | null;
  execution_method: string;
  lane: string;
  base: number;
  subtotal: number | null;
  discount_amount: number | null;
  total: number | null;
  deposit_amount: number | null;
  balance_due: number | null;
  eligible_subtotal: number | null;
  non_discountable_total: number | null;
  breakdown: Array<{ code: string; label: string; amount: number; category: string }>;
  payment_mode: "split_50_50";
  review_required: boolean;
  review_reasons: string[];
  rationale: string;
  pricing_guards: CanonicalQuoteProjection["quote"]["pricingGuards"] | null;
  route_intelligence: GovernedQuoteRouteIntelligenceView;
}

export interface GovernedQuoteComposition {
  preview: GovernedQuotePreview;
  truth: CanonicalExecutionTruth;
  route: QuoteRouteIntelligence;
  projection: CanonicalQuoteProjection | null;
  executionReviewReasons: string[];
  pricingReviewReasons: string[];
}

export function stripServerProjectedKeys(input: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...input };
  for (const key of SERVER_PROJECTED_KEYS) delete clean[key];
  return clean;
}

function routeView(route: QuoteRouteIntelligence): GovernedQuoteRouteIntelligenceView {
  return {
    destination: route.destination,
    documentCategory: route.documentCategory,
    routeType: route.routeType,
    routeLabel: route.routeLabel,
    authorityStatus: route.authorityStatus,
    reviewRequired: route.reviewRequired,
    reviewReasons: route.reviewReasons,
    safetyNotice: route.safetyNotice,
    acceptanceNotice: route.acceptanceNotice,
    issuingLane: route.issuingLane,
    federalAgency: route.federalAgency,
    receivingAuthorityType: route.receivingAuthorityType,
    authorityPath: route.authorityPath,
    advisories: route.advisories,
  };
}

export function composeGovernedQuote(input: Record<string, unknown>): GovernedQuoteComposition {
  const body = stripServerProjectedKeys(input);
  const truth = normalizeExecutionTruth(body);
  const executionReviewReasons = executionQuoteReviewReasons(truth);
  const route = projectQuoteRouteIntelligence({ ...body, authentication_requirement: truth.authentication_requirement });
  const view = routeView(route);

  if (executionReviewReasons.length > 0) {
    return {
      truth,
      route,
      projection: null,
      executionReviewReasons,
      pricingReviewReasons: [],
      preview: {
        matter_base: null,
        execution_method: truth.execution_method,
        lane: "Review Required",
        base: 0,
        subtotal: null,
        discount_amount: null,
        total: null,
        deposit_amount: null,
        balance_due: null,
        eligible_subtotal: null,
        non_discountable_total: null,
        breakdown: [],
        payment_mode: "split_50_50",
        review_required: true,
        review_reasons: [...new Set([...executionReviewReasons, ...route.reviewCodes])],
        rationale:
          "Execution facts require operator resolution before a payment amount can be approved.",
        pricing_guards: null,
        route_intelligence: view,
      },
    };
  }

  const legacy = executionTruthToLegacy(truth);
  const projection = projectCanonicalQuote({
    ...body,
    execution_method: truth.execution_method,
    notarization_requirement: truth.notarization_requirement,
    authentication_requirement: truth.authentication_requirement,
    mobile: legacy.mobile,
    ron_required: truth.execution_method === "ron",
    notarization_required: legacy.notarization_required,
    apostille_required: legacy.apostille_required,
    // Route intelligence can only add governed triggers, never clear them.
    consular_legalization:
      asBool(body.consular_legalization) || route.pricingFacts.consular_legalization,
    federal_apostille:
      asBool(body.federal_apostille) ||
      asBool(body.fbi_apostille) ||
      route.pricingFacts.federal_apostille,
    receiving_authority_uncertain:
      asBool(body.receiving_authority_uncertain) ||
      route.pricingFacts.receiving_authority_uncertain,
    // Discounts are applied only through the governed discount service on commit.
    discount_amount: 0,
  });

  const quote = projection.quote;
  const baseLine = quote.lineItems.find((item) => item.category === "base");
  const pricingReviewReasons = [...projection.reviewReasons];
  const reviewReasons = [...new Set([...pricingReviewReasons, ...route.reviewCodes])];
  const reviewRequired = projection.reviewRequired || route.reviewRequired;

  return {
    truth,
    route,
    projection,
    executionReviewReasons,
    pricingReviewReasons,
    preview: {
      matter_base: projection.matterBase,
      execution_method: projection.executionMethod,
      lane: baseLine?.label ?? projection.matterBase,
      base: baseLine?.amount ?? 0,
      subtotal: quote.subtotal,
      discount_amount: quote.discountAmount,
      total: quote.total,
      deposit_amount: quote.depositAmount,
      balance_due: quote.balanceDue,
      eligible_subtotal: projection.eligibleSubtotal,
      non_discountable_total: projection.nonDiscountableTotal,
      breakdown: quote.lineItems.map((item) => ({
        code: item.code,
        label: item.label,
        amount: item.amount,
        category: item.category,
      })),
      payment_mode: quote.paymentMode,
      review_required: reviewRequired,
      review_reasons: reviewReasons,
      rationale: route.reviewRequired
        ? "Destination and document route facts require governed operator review before a payment amount can be approved. Amounts shown are indicative only."
        : projection.reviewRequired
          ? "The Matter contains a governed exception that requires operator review before payment is requested."
          : "Canonical private pricing composed from the reviewed Matter scope.",
      pricing_guards: quote.pricingGuards,
      route_intelligence: view,
    },
  };
}
