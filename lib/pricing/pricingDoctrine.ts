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

export const INTERNAL_BASES = {
  signature: 750,
  priority: 975,
  executive: 1850,
  route_review_min: 95,
  route_review_max: 175,
  apostille_first_min: 275,
  apostille_first_max: 495,
};

export const PRICING_RULES = {
  publicLabels: {
    signature: "Signature Execution",
    priority: "Priority Execution",
    executive: "Executive Execution",
    route_review_only: "Document Route Review",
    apostille_only: "Apostille Coordination",
  },
  visibility: "public_hidden",
};

export default {
  PUBLIC_PRICING_LANGUAGE,
  INTERNAL_BASES,
  PRICING_RULES,
};
