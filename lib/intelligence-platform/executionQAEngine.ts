export const COMPLIANCE_REVIEW_ENGINE = {
  rule: "No matter advances to scheduling until administrative compliance review is complete.",
  reviewItems: [
    "Document completeness",
    "Required signatures",
    "Required notarial certificates",
    "Witness requirements",
    "Identity requirements",
    "Apostille eligibility",
    "Legalization pathway",
    "Translation needs",
    "Destination-country administrative requirements",
    "Courier readiness"
  ],
  safety: "This review is administrative only and does not constitute legal advice."
} as const;

export const EXECUTION_QA_CHECKS = [
  "Signer names",
  "Dates",
  "Required signatures",
  "Required notarial certificates",
  "Witness completion",
  "Identity verification completion",
  "Document completeness",
  "Courier documentation",
  "Apostille packet readiness"
] as const;
