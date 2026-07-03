export type TranslationStatus =
  | "not_needed"
  | "unknown"
  | "likely_needed"
  | "client_provided"
  | "partner_needed"
  | "accuracy_affidavit_needed"
  | "receiving_authority_specific"
  | "manual_review";
