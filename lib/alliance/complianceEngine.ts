export const ALLIANCE_COMPLIANCE_ITEMS = [
  { id: "ron-commission", label: "RON Commission", requiredWhen: "Remote online notarization services are offered." },
  { id: "notary-commission", label: "Notary Commission", requiredWhen: "Notarial services are offered." },
  { id: "insurance", label: "Insurance", requiredWhen: "Required by client, agency, facility, or role." },
  { id: "background-review", label: "Background Review", requiredWhen: "Required by role, facility, client, or agency." },
  { id: "training", label: "Training", requiredWhen: "Required before routing eligibility." },
  { id: "operating-agreement", label: "Operating Agreement", requiredWhen: "Required for Alliance activation." },
  { id: "required-documents", label: "Required Documents", requiredWhen: "Required during onboarding and renewal." },
  { id: "continuing-education", label: "Continuing Education", requiredWhen: "Required for continued readiness." },
  { id: "role-certifications", label: "Role-Specific Certifications", requiredWhen: "Only when actually held and verified." }
] as const;

export const COMPLIANCE_LANGUAGE = {
  noFalseStatus: "Do not display a status as verified until review is complete.",
  noAdvice: "Compliance tracking is operational readiness support only and is not legal, medical, or immigration advice.",
  noEndorsement: "Alliance status is not a government endorsement."
} as const;
