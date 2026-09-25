import { DOCUMENT_FEES, MATTER_BASES } from "./pricingCatalog";

export const PUBLIC_PRICING_LANGUAGE = `Pricing is issued after review.

Every matter is reviewed for:
- document type
- destination country
- issuing authority
- receiving authority
- signer location
- execution method
- apostille or authentication route
- translation sensitivity
- urgency
- courier or release requirements

The Milano Seal™ does not compete as a low-cost document checkout service.

We provide structured international document execution, apostille/authentication coordination, secure matter tracking, and controlled final release.
`;

// Internal pricing references derive from the canonical private catalog.
// Public surfaces must never render these numeric values.
export const INTERNAL_BASES = {
  authentication: MATTER_BASES.authentication.amount,
  signature: MATTER_BASES.signature.amount,
  priority: MATTER_BASES.priority.amount,
  executive: MATTER_BASES.executive.amount,
  international_passport_execution: MATTER_BASES.international_passport_execution.amount,
  additional_apostilled_document: DOCUMENT_FEES.additional_apostilled_document,
};

export const PRICING_RULES = {
  publicLabels: {
    authentication: "Authentication Matter",
    signature: "Signature Matter",
    priority: "Priority Matter",
    executive: "Executive Matter",
    international_passport_execution: "International Passport Execution Matter",
    route_review_only: "Document Route Review",
    apostille_only: "Apostille Coordination",
  },
  visibility: "public_hidden",
  firstDocumentIncluded: true,
  firstApostilleCoordinationIncludedWhenRequired: true,
  noMatterBaseStacking: true,
  noApostilleDocumentDoubleCharge: true,
  unknownConsularFederalNonHagueRequiresReview: true,
};

export default {
  PUBLIC_PRICING_LANGUAGE,
  INTERNAL_BASES,
  PRICING_RULES,
};
