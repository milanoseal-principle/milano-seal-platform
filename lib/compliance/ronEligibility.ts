export type DocumentType =
  | 'PowerOfAttorney'
  | 'CorporateResolution'
  | 'VitalRecord'
  | 'Affidavit'
  | 'YachtBillOfSale'
  | 'EquineBillOfSale'
  | 'MedicalConsent'
  | 'TrustDocument'
  | 'BackgroundCheck'
  | 'Diploma'
  | 'CourtDocument'
  | 'DiamondAffidavit';

export interface RonEligibility {
  documentType: DocumentType;
  isRonAllowed: boolean;
  foreignAcceptanceRisk: 'High' | 'Medium' | 'Low';
  operatorReviewRequired: boolean;
  notes: string;
}

export const ronEligibilityMatrix: RonEligibility[] = [
  {
    documentType: "VitalRecord",
    isRonAllowed: false,
    foreignAcceptanceRisk: "High",
    operatorReviewRequired: true,
    notes: "Vital records are government-issued and cannot be notarized via RON. Original certified copies must be obtained from the issuing authority.",
  },
  {
    documentType: "PowerOfAttorney",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Medium",
    operatorReviewRequired: true,
    notes: "RON is permitted for domestic use. Foreign-bound POAs require operator review — destination country acceptance of RON-notarized documents varies significantly.",
  },
  {
    documentType: "CorporateResolution",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Low",
    operatorReviewRequired: false,
    notes: "Corporate resolutions are generally accepted when RON-notarized. Standard apostille workflow applies for international use.",
  },
  {
    documentType: "Affidavit",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Low",
    operatorReviewRequired: false,
    notes: "Affidavits may be executed via RON. Verify destination authority requirements if the affidavit is intended for foreign submission.",
  },
  {
    documentType: "YachtBillOfSale",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Medium",
    operatorReviewRequired: true,
    notes: "Yacht bills of sale may be executed via RON, but vessel registry and flag-state requirements vary. Operator review required to confirm destination acceptance.",
  },
  {
    documentType: "EquineBillOfSale",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Medium",
    operatorReviewRequired: true,
    notes: "Equine bills of sale may be executed via RON. Export documentation and veterinary health certificate requirements are outside the scope of this service.",
  },
  {
    documentType: "MedicalConsent",
    isRonAllowed: false,
    foreignAcceptanceRisk: "High",
    operatorReviewRequired: true,
    notes: "Medical consent documents require in-person notarization in most jurisdictions. Healthcare provider and facility requirements must be confirmed before execution.",
  },
  {
    documentType: "TrustDocument",
    isRonAllowed: true,
    foreignAcceptanceRisk: "High",
    operatorReviewRequired: true,
    notes: "Trust documents may be executed via RON where permitted by state law, but foreign acceptance risk is high. Operator review required for all trust-related matters.",
  },
  {
    documentType: "BackgroundCheck",
    isRonAllowed: false,
    foreignAcceptanceRisk: "High",
    operatorReviewRequired: true,
    notes: "Background check authorization documents typically require in-person notarization per the issuing agency's requirements.",
  },
  {
    documentType: "Diploma",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Low",
    operatorReviewRequired: false,
    notes: "Diploma copies may be notarized via RON. Original diplomas submitted directly to the apostille authority are preferred where possible.",
  },
  {
    documentType: "CourtDocument",
    isRonAllowed: false,
    foreignAcceptanceRisk: "High",
    operatorReviewRequired: true,
    notes: "Court-issued documents require clerk certification and cannot be notarized via RON. Operator review required to confirm proper authentication chain.",
  },
  {
    documentType: "DiamondAffidavit",
    isRonAllowed: true,
    foreignAcceptanceRisk: "Medium",
    operatorReviewRequired: true,
    notes: "Diamond and gemstone ownership affidavits may be executed via RON. Operator review required to confirm destination customs and import authority acceptance.",
  },
];
