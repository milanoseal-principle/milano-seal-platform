// Pricing adapters — map canonical Matter attributes into the controlling
// engine's input shape. Translation only; no price constants here.

import type { CanonicalMatterObject } from "../platform/canonicalMatter";
import type { ConsumerQuoteInput, QuoteContext } from "./canonicalPricingGateway";

/**
 * Build a consumer quote input from a canonical Matter. Only maps fields that
 * exist; unknowns are omitted so the controlling engine applies its own defaults.
 */
export function matterToConsumerQuoteInput(m: Partial<CanonicalMatterObject>): ConsumerQuoteInput {
  const input: Record<string, unknown> = {};
  if (m.destinationCountry ?? m.destinationCountryId) {
    input.destinationCountry = m.destinationCountry ?? m.destinationCountryId;
  }
  if (m.documentFamily) input.documentType = m.documentFamily;
  if (m.urgency) input.urgency = m.urgency;
  if (Array.isArray(m.witnessIds)) input.witnessCount = m.witnessIds.length;
  return input as ConsumerQuoteInput;
}

/** Derive manual-review context from a canonical Matter's flags. */
export function matterToQuoteContext(m: Partial<CanonicalMatterObject>): QuoteContext {
  const flags = m.manualReviewFlags ?? [];
  const has = (k: string) => flags.some((f) => f.toLowerCase().includes(k));
  return {
    regulatedUseCase: has("regulated"),
    courtMatter: has("court"),
    consularMatter: has("consular"),
    custodyMatter: has("custody"),
    immigrationMatter: has("immigration"),
    fingerprintOrOri: has("fingerprint") || has("ori"),
    receivingAuthorityUncertain: !m.receivingAuthorityId,
  };
}
