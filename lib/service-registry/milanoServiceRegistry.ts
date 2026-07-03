import type { ServiceCategory, ServiceRegistryEntry } from "./types";

export const milanoServiceRegistry: ServiceRegistryEntry[] = [
  {
    id: "regulated-document-support",
    category: "regulated_document_support",
    label: "Regulated Document Support",
    publicSummary:
      "Coordination and document preparation review for regulated document matters, with receiving-authority review at every step.",
    operatorNotes: ["Manual review for any regulated professional category."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "fingerprinting-document-support",
    category: "fingerprinting_document_support",
    label: "Fingerprinting Document Support",
    publicSummary:
      "Document routing and coordination support for fingerprint-based submissions and identity-history requests.",
    operatorNotes: ["Confirm agency instructions / ORI before any submission."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "fbi-identity-history-routing",
    category: "fbi_identity_history_routing",
    label: "FBI Identity History Summary Routing",
    publicSummary:
      "Coordination for FBI Identity History Summary requests for personal, foreign-use, and immigration document purposes.",
    operatorNotes: ["Not a substitute for an employment/licensing background check."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
  {
    id: "state-background-document-routing",
    category: "state_background_document_routing",
    label: "State Background Document Routing",
    publicSummary:
      "Routing support for state employment and licensing background document submissions.",
    operatorNotes: ["Agency instructions required before submission."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "apostille-authentication-coordination",
    category: "apostille_authentication_coordination",
    label: "Apostille & Authentication Coordination",
    publicSummary:
      "Coordination of apostille and authentication routing based on document authority and destination review.",
    operatorNotes: ["Confirm destination classification before routing."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
  {
    id: "federal-authentication",
    category: "federal_authentication",
    label: "Federal Authentication Coordination",
    publicSummary:
      "Coordination for federal document authentication routing, including federal-issued document handling.",
    operatorNotes: ["Federal documents route to federal authentication."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
  {
    id: "state-vital-record-apostille",
    category: "state_vital_record_apostille",
    label: "State Vital Record Apostille",
    publicSummary:
      "Apostille coordination for state and county vital records through issuing-state rules.",
    operatorNotes: ["Confirm issuing state and certification chain."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
  {
    id: "translation-coordination",
    category: "translation_coordination",
    label: "Translation Coordination",
    publicSummary:
      "Coordination of certified translation and accuracy affidavit support for receiving authorities.",
    operatorNotes: ["Unknown translation need routes to manual review."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
  {
    id: "mobile-notary-coordination",
    category: "mobile_notary_coordination",
    label: "Mobile Notary Coordination",
    publicSummary:
      "Florida mobile notary coordination by appointment through vetted field coordination.",
    operatorNotes: ["Mobile requests require operator review."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "loan-signing-coordination",
    category: "loan_signing_coordination",
    label: "Loan Signing Coordination",
    publicSummary:
      "Coordination support for loan signing document packages by appointment.",
    operatorNotes: ["Confirm package completeness before scheduling."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "field-partner-network",
    category: "field_partner_network",
    label: "Field Partner Network",
    publicSummary:
      "Partner provider referral network for field-based fingerprinting and mobile coordination.",
    operatorNotes: ["Partner referral only after operator review."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "immigration-citizenship-documents",
    category: "immigration_citizenship_documents",
    label: "Immigration & Citizenship Documents",
    publicSummary:
      "Document preparation and apostille coordination for immigration and citizenship document matters.",
    operatorNotes: ["The Milano Seal does not provide immigration advice."],
    requiresManualReview: true,
    paymentGatedScheduling: true,
  },
  {
    id: "professional-license-apostille",
    category: "professional_license_apostille",
    label: "Professional License Apostille",
    publicSummary:
      "Apostille coordination for professional license documents intended for foreign use.",
    operatorNotes: ["Confirm licensing board certification requirements."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
  {
    id: "global-business-documents",
    category: "global_business_documents",
    label: "Global Business Documents",
    publicSummary:
      "Coordination for corporate and commercial document authentication for international use.",
    operatorNotes: ["Confirm corporate certification chain."],
    requiresManualReview: false,
    paymentGatedScheduling: true,
  },
];

export function getServiceByCategory(
  category: ServiceCategory
): ServiceRegistryEntry | undefined {
  return milanoServiceRegistry.find((entry) => entry.category === category);
}
