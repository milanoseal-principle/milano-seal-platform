export type FingerprintUseCase =
  | "fbi_identity_history_summary"
  | "state_employment_licensing"
  | "healthcare_license"
  | "nursing_board"
  | "medical_board"
  | "teacher_school_district"
  | "security_guard_license"
  | "corrections_jail_applicant"
  | "real_estate_license"
  | "concealed_weapon_license"
  | "immigration_residency_citizenship"
  | "professional_license_foreign_use"
  | "study_abroad"
  | "adoption"
  | "visa_application"
  | "digital_nomad_residency"
  | "recruiter_group_intake"
  | "unknown";

export type FingerprintMethod =
  | "electronic_livescan"
  | "hard_card_fd_258"
  | "fbi_fd_1164"
  | "out_of_state_card_scan"
  | "usps_fbi_electronic"
  | "fbi_approved_channeler"
  | "agency_directed_vendor"
  | "mobile_partner_referral"
  | "manual_review";

export interface FingerprintRoutingResult {
  useCase: FingerprintUseCase;
  authorityType: string;
  requiredAgencyInstruction: boolean;
  oriRequired: boolean;
  oriProvided: boolean;
  allowedMethods: FingerprintMethod[];
  blockedMethods: FingerprintMethod[];
  clientQuestions: string[];
  operatorChecklist: string[];
  publicSummary: string;
  internalNotes: string[];
  requiresAgencyConfirmation: boolean;
  requiresManualReview: boolean;
  canCoordinatePartner: boolean;
  canTransmit: boolean;
  canApostilleAfterResult: boolean;
  warnings: string[];
}
