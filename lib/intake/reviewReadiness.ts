// Smart Intake review-readiness — the single source of truth for what the
// client must resolve before the courtesy/standard checkout may open.
//
// These are pure functions (no React, no network) so the exact "is this matter
// quote-ready" decision is unit-tested and identical everywhere it is consulted.
// Client input is required only for facts the client uniquely controls. Facts
// that can be resolved from document review / operator verification must never
// trap the client in a manual-edit loop.

import type { SmartIntakeClassification } from "@/lib/intake/smartClassification";

export type TimelineChoice = "" | "standard" | "expedited" | "urgent";
export type DeliveryChoice = "" | "digital" | "domestic_courier" | "international_courier";

const GENERIC_DOCUMENT = /^(other|others|document|documents|unspecified|misc|miscellaneous|general|n\/?a)$/i;

export const DOCUMENT_TITLE_REQUIRED = "Document title confirmation required";

export function documentIdentityLabel(documentType?: string): string {
  const value = (documentType ?? "").trim();
  if (!value || GENERIC_DOCUMENT.test(value)) return DOCUMENT_TITLE_REQUIRED;
  return value;
}

export function serviceStateLabel(state: string, requiredLabel: string): string {
  switch (state) {
    case "required":
      return requiredLabel;
    case "not_required":
      return "Not required — based on your instruction";
    case "already_completed":
      return "Already completed";
    default:
      return "Will be confirmed from document review";
  }
}

export function isDomesticDestination(destination?: string): boolean {
  return /^(united states|usa|u\.?s\.?a?\.?|america)$/i.test((destination ?? "").trim());
}

export interface ReadinessInput {
  classification: SmartIntakeClassification;
  timeline: TimelineChoice;
  delivery: DeliveryChoice;
  pricingApproved: boolean;
}

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

  // Unknown notarization is intentionally NOT a client blocker. Smart Intake or
  // document review resolves it. Only a positively-required notarization needs
  // the client to choose the execution method when neither RON nor mobile is known.
  if (c.notarization === "required" && c.ron === "unknown" && c.mobile === "unknown") {
    out.push("Execution method (remote or in-person)");
  }

  if (!timeline) out.push("Preferred execution timeline");
  if (!delivery) out.push("Delivery method");

  return out;
}

export function isQuoteReady(input: ReadinessInput): boolean {
  return input.pricingApproved && outstandingRequirements(input).length === 0;
}
