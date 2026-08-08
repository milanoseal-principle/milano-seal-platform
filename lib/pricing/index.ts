// Pricing domain index — canonical import surface.
//
// New code should import the gateway and adapters from here. The controlling
// engine (lib/pricing.ts) remains the source of final consumer pricing; the
// gateway delegates to it. Legacy/parallel pricing modules are NOT deleted;
// they are marked @deprecated as adapters land.

export * from "./canonicalPricingGateway";
export * from "./pricingAdapters";
export * from "./pricingSafety";

/**
 * @deprecated Import the controlling engine directly from "@/lib/pricing" for
 * now; route NEW consumers through canonicalPricingGateway.quoteConsumer.
 * Parallel engines (command-center/pricingIntelligence, config/pricing,
 * pricing/smartIntakePricingEngine) are being migrated behind the gateway and
 * must not add new final-price constants.
 */
export const PRICING_CANONICAL_NOTE =
  "Final consumer pricing = lib/pricing.ts via canonicalPricingGateway. Non-consumer categories are operator-prepared (manual review).";
