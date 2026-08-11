/**
 * pricingAdapter — high-value asset pricing CONTEXT only. Delegates the actual
 * quote to the canonical pricing gateway (via the maritime adapter). Produces a
 * lane recommendation and complexity notes — never an independent final price.
 */

import type { HighValueAssetMatter } from "@/lib/high-value-assets/types";
import {
  prepareMaritimeQuote,
  type MaritimeServiceLane,
} from "@/lib/maritime/pricing/maritimePricingAdapter";
import type { CanonicalQuoteResult } from "@/lib/pricing/canonicalPricingGateway";

export interface AssetPricingContext {
  recommendedLane: MaritimeServiceLane;
  complexityNotes: string[];
  requiresManualQuote: boolean;
  canonicalPricingContext: CanonicalQuoteResult;
}

export function buildHighValueAssetPricingContext(m: HighValueAssetMatter): AssetPricingContext {
  const notes: string[] = [];
  if (m.international) notes.push("International handling / apostille coordination");
  if (m.safetyFlags.requiresUSCGReview) notes.push("USCG-linked vessel documentation");
  if (m.safetyFlags.requiresFAAReview) notes.push("Aircraft / FAA-linked documentation");
  if (m.safetyFlags.requiresTitleReview) notes.push("Title/ownership review dependency");
  if (m.safetyFlags.requiresEscrowReview) notes.push("Escrow coordination dependency");

  const recommendedLane: MaritimeServiceLane = m.maritimeLinked
    ? "port_area_field_execution"
    : m.international
      ? "international_authentication_coordination"
      : "maritime_signature_execution";

  return {
    recommendedLane,
    complexityNotes: notes,
    // High-value asset matters are always operator-quoted (never auto-priced).
    requiresManualQuote: true,
    canonicalPricingContext: prepareMaritimeQuote(),
  };
}
