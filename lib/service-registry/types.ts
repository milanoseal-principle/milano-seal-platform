export type ServiceCategory =
  | "regulated_document_support"
  | "fingerprinting_document_support"
  | "fbi_identity_history_routing"
  | "state_background_document_routing"
  | "apostille_authentication_coordination"
  | "federal_authentication"
  | "state_vital_record_apostille"
  | "translation_coordination"
  | "mobile_notary_coordination"
  | "loan_signing_coordination"
  | "field_partner_network"
  | "immigration_citizenship_documents"
  | "professional_license_apostille"
  | "global_business_documents";

export interface ServiceRegistryEntry {
  id: string;
  category: ServiceCategory;
  label: string;
  publicSummary: string;
  operatorNotes: string[];
  requiresManualReview: boolean;
  paymentGatedScheduling: true;
}
