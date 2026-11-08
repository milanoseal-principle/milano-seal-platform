// INTERNAL ONLY — canonical Milano Seal private pricing catalog.
// Public surfaces must never import or render numeric values from this module.

export const MATTER_BASES = {
  authentication: {
    amount: 599,
    label: "Authentication Matter",
    description:
      "For documents already properly issued, certified, or executed that do not require a new signer execution session.",
  },
  signature: {
    amount: 750,
    label: "Signature Matter",
    description:
      "For Matters requiring signer coordination and either an eligible RON session or in-person execution.",
  },
  priority: {
    amount: 975,
    label: "Priority Matter",
    description: "For genuinely expedited or heightened coordination.",
  },
  executive: {
    amount: 1850,
    label: "Executive Matter",
    description:
      "For complex, urgent, high-touch, multi-jurisdiction, consular, or unusual custody Matters.",
  },
  international_passport_execution: {
    amount: 350,
    label: "International Passport Document Review / Execution Coordination",
    description:
      "Specialty reviewed execution Matter for international passport affidavits, declarations, witness forms, or related execution documents where Milano is coordinating document readiness and execution rather than an apostille Matter.",
  },
} as const;

export const DOCUMENT_FEES = {
  additional_apostilled_document: 250,
  additional_non_apostille_document: 75,
  fbi_federal_apostille_coordination: 750,
  multi_jurisdiction_handling: 300,
} as const;

export const NOTARY_SIGNER_FEES = {
  florida_notarial_act: 10,
  additional_signer: 150,
  remote_witness: 50,
  in_person_witness: 75,
  international_signer_coordination: 200,
} as const;

export const MOBILE_TRAVEL_FEES = {
  local_radius_miles: 10,
  tier_11_25: 75,
  tier_26_50: 150,
} as const;

export const TIMING_FEES = {
  expedited: 200,
  rush_same_day: 400,
  after_hours_evening: 150,
  weekend: 250,
  holiday: 350,
} as const;

export const LANGUAGE_PREP_FEES = {
  translation_coordination: 150,
} as const;

export const SPECIAL_HANDLING_FEES = {
  executive_in_person_state_handling: 500,
} as const;

export type MatterBaseId = keyof typeof MATTER_BASES;

export const QUOTE_REVIEW_ONLY = [
  "consular_legalization",
  "document_preparation_execution_formatting",
  "certified_translation",
  "mobile_travel_over_50_miles",
  "special_handling",
  "unknown_authority_fee",
] as const;

export type QuoteReviewOnlyCode = (typeof QUOTE_REVIEW_ONLY)[number];

export const PRIVATE_PRICING_GUARDS = {
  stackMatterBases: false,
  firstDocumentIncludedInBase: true,
  firstApostilleCoordinationIncludedWhenRequired: true,
  doubleChargeApostilledDocumentWithGenericDocumentFee: false,
  unknownConsularFederalNonHagueAutoPrice: false,
  publicNumericPricingAllowed: false,
} as const;
