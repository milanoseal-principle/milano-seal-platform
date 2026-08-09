// Smart Intake review-readiness — the single source of truth for what the
// client must resolve before the courtesy/standard checkout may open.
//
// These are pure functions (no React, no network) so the exact "is this matter
// quote-ready" decision is unit-tested and identical everywhere it is consulted.
// The review UI must never open checkout while outstanding() is non-empty:
// price-critical facts (document identity, issuing authority, destination,
// timeline, delivery) determine the authoritative quote, and a naked price
// shown before they are known is exactly the defect this prevents.

import type { SmartIntakeClassification } from "@/lib/intake/smartClassification";

export type TimelineChoice = "" | "standard" | "expedited" | "urgent";
export type DeliveryChoice = "" | "digital" | "domestic_courier" | "international_courier";

// Never invent a generic category. If Smart Intake cannot identify the exact
// official instrument, the client must confirm the title before checkout.
const GENERIC_DOCUMENT = /^(other|others|document|documents|unspecified|misc|miscellaneous|general|n\/?a)$/i;

export const DOCUMENT_TITLE_REQUIRED = "Document title confirmation required";

export function documentIdentityLabel(documentType?: string): string {
  const value = (documentType ?? "").trim();
  if (!value || GENERIC_DOCUMENT.test(value)) return DOCUMENT_TITLE_REQUIRED;
  return value;
}

// Explicit-negative services are shown as a resolved instruction, never as an
// ambiguous "To be confirmed". Unknown services surface as a checkout blocker.
export function serviceStateLabel(state: string, requiredLabel: string): string {
  switch (state) {
    case "required":
      return requiredLabel;
    case "not_required":
      return "Not required — based on your instruction";
    case "already_completed":
      return "Already completed";
    default:
      return "Confirmation required before checkout";
  }
}

export function isDomesticDestination(destination?: string): boolean {
  return /^(united states|usa|u\.?s\.?a?\.?|america)$/i.test((destination ?? "").trim());
}

export interface ReadinessInput {
  classification: SmartIntakeClassification;
  timeline: TimelineChoice;
  delivery: DeliveryChoice;
  /** True only when the canonical pricing projection returned an approved price. */
  pricingApproved: boolean;
}

// Human-readable, quote-critical facts still missing. Order is presentation order.
export function outstandingRequirements(input: ReadinessInput): string[] {
  const { classification: c, timeline, delivery } = input;
  const out: string[] = [];

  if (documentIdentityLabel(c.documentType) === DOCUMENT_TITLE_REQUIRED) {
    out.push("Exact document title for each document");
  }

  const needsIssuingAuthority = c.apostille === "required" || c.authentication === "required";
  if (needsIssuingAuthority && !(c.originJurisdiction && c.originJurisdiction.trim())) {
    out.push("Issuing state / authority");
  }

  if (!(c.destinationCountry && c.destinationCountry.trim())) {
    out.push("Destination country");
  }

  if (c.notarization === "unknown") {
    out.push("Notarization requirement");
  } else if (c.notarization === "required" && c.ron === "unknown" && c.mobile === "unknown") {
    out.push("Execution method (remote or in-person)");
  }

  if (!timeline) out.push("Preferred execution timeline");
  if (!delivery) out.push("Delivery method");

  return out;
}

// Checkout may open only when the canonical price is approved AND every
// quote-critical fact is resolved. Both conditions are required.
export function isQuoteReady(input: ReadinessInput): boolean {
  return input.pricingApproved && outstandingRequirements(input).length === 0;
}
