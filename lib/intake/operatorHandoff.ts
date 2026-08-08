// Stage 6 — the canonical operator handoff builder.
//
// A PROJECTION of canonical truth, not a second decision engine. It consumes the
// existing classification + the canonical pricing result and assembles one
// operator packet so no operator has to reinterpret the raw matter from scratch.
// It never recomputes classification, routing, or pricing.
//
// Role-safe by construction: this is an operator/founder artifact. Client
// surfaces must never receive it.

import type { SmartIntakeClassification, ServiceState } from "./smartClassification";
import type { MilanoPricingResult } from "../pricing/milanoPricingTruth";
import { projectClientPricing, type ClientPricingProjection } from "../pricing/pricingProjections";

export interface OperatorHandoff {
  matterId: string;
  originalDescription: string;
  fileReferences: string[]; // references/ids only — never raw contents

  classification: SmartIntakeClassification;
  explicitNegatives: string[];
  contradictions: string[];
  serviceStates: Record<string, ServiceState>;

  missingCriticalFacts: string[];
  manualReviewReasons: string[];

  // Canonical pricing result (same object priceCanonicalMatter produced).
  pricing: MilanoPricingResult;
  recommendedLane: MilanoPricingResult["suggestedLane"];

  classificationConfidence: SmartIntakeClassification["classificationConfidence"];
  routingConfidence: SmartIntakeClassification["routingConfidence"];
  pricingConfidence: MilanoPricingResult["pricingConfidence"];

  /** Marks this artifact operator-internal; client projections must exclude it. */
  audience: "operator";
}

export interface OperatorHandoffInput {
  matterId: string;
  originalDescription?: string;
  fileReferences?: string[];
  classification: SmartIntakeClassification;
  pricing: MilanoPricingResult;
}

export function buildOperatorHandoff(input: OperatorHandoffInput): OperatorHandoff {
  const c = input.classification;
  const serviceStates: Record<string, ServiceState> = {
    notarization: c.notarization,
    ron: c.ron,
    apostille: c.apostille,
    authentication: c.authentication,
    translation: c.translation,
    witness: c.witness,
    mobile: c.mobile,
    courier: c.courier,
    shipping: c.shipping,
  };

  return {
    matterId: input.matterId,
    originalDescription: input.originalDescription ?? "",
    fileReferences: input.fileReferences ?? [],
    classification: c,
    explicitNegatives: c.explicitNegatives,
    contradictions: c.contradictions,
    serviceStates,
    missingCriticalFacts: c.missingCriticalFacts,
    manualReviewReasons: [...c.manualReviewReasons, ...input.pricing.manualReviewReasons],
    pricing: input.pricing,
    recommendedLane: input.pricing.suggestedLane,
    classificationConfidence: c.classificationConfidence,
    routingConfidence: c.routingConfidence,
    pricingConfidence: input.pricing.pricingConfidence,
    audience: "operator",
  };
}

/** Client-safe projection — what a CLIENT may see. Excludes the operator packet.
 * Reuses the canonical projectClientPricing (one projection rule everywhere). */
export function clientProjection(handoff: OperatorHandoff): { pricing: ClientPricingProjection } {
  return { pricing: projectClientPricing(handoff.pricing) };
}
