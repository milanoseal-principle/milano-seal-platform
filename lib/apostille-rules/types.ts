export type AuthorityLevel =
  | "state"
  | "federal"
  | "court"
  | "county_clerk"
  | "notary_commission"
  | "department_of_state"
  | "embassy_consular"
  | "manual_review";

export type DocumentAuthority =
  | "state_vital_record"
  | "county_vital_record"
  | "notarized_private_document"
  | "court_document"
  | "school_document"
  | "professional_license"
  | "fbi_background_check"
  | "federal_agency_document"
  | "corporate_document"
  | "commercial_customs_document"
  | "translation_affidavit"
  | "unknown";

export type ApostilleRoute =
  | "state_apostille"
  | "federal_authentication"
  | "consular_legalization"
  | "county_certification_then_state"
  | "school_notarization_then_state"
  | "agency_certification_then_state"
  | "manual_review";

export interface ApostilleRoutingResult {
  documentAuthority: DocumentAuthority;
  authorityLevel: AuthorityLevel;
  route: ApostilleRoute;
  hagueDestination: boolean | null;
  publicSummary: string;
  operatorChecklist: string[];
  warnings: string[];
  requiresManualReview: boolean;
}
