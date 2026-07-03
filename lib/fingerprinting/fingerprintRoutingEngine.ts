import type {
  FingerprintMethod,
  FingerprintRoutingResult,
  FingerprintUseCase,
} from "./types";
import { getFingerprintUseCase } from "./fingerprintUseCaseRegistry";

const EMPLOYMENT_LICENSING_USE_CASES: FingerprintUseCase[] = [
  "state_employment_licensing",
  "healthcare_license",
  "nursing_board",
  "medical_board",
  "teacher_school_district",
  "security_guard_license",
  "corrections_jail_applicant",
  "real_estate_license",
];

const FBI_IDENTITY_HISTORY_USE_CASES: FingerprintUseCase[] = [
  "fbi_identity_history_summary",
  "professional_license_foreign_use",
  "immigration_residency_citizenship",
  "study_abroad",
  "adoption",
  "visa_application",
  "digital_nomad_residency",
];

export interface FingerprintRoutingInput {
  useCase: FingerprintUseCase;
  oriProvided?: boolean;
  agencyInstructionsUploaded?: boolean;
}

export function routeFingerprint(
  input: FingerprintRoutingInput
): FingerprintRoutingResult {
  const { useCase } = input;
  const oriProvided = input.oriProvided ?? false;
  const agencyInstructionsUploaded = input.agencyInstructionsUploaded ?? false;
  const entry = getFingerprintUseCase(useCase);

  const warnings: string[] = [];
  const internalNotes: string[] = [];
  const clientQuestions: string[] = [];
  const operatorChecklist: string[] = [];
  const allowedMethods: FingerprintMethod[] = [];
  const blockedMethods: FingerprintMethod[] = [];

  let requiredAgencyInstruction = false;
  let oriRequired = false;
  let requiresAgencyConfirmation = false;
  let requiresManualReview = false;
  let canCoordinatePartner = true;
  let canTransmit = true;
  let canApostilleAfterResult = false;

  // Never predict clearance or guarantee approval.
  internalNotes.push(
    "Never predict clearance or guarantee approval. Final acceptance remains subject to the receiving authority."
  );

  if (useCase === "unknown") {
    requiresManualReview = true;
    canTransmit = false;
    canCoordinatePartner = false;
    blockedMethods.push("manual_review");
    warnings.push("Use case unknown — manual review required before routing.");
    clientQuestions.push("What authority is requesting the fingerprints?");
    operatorChecklist.push("Classify use case before any routing.");
    return {
      useCase,
      authorityType: entry.authorityType,
      requiredAgencyInstruction,
      oriRequired,
      oriProvided,
      allowedMethods,
      blockedMethods,
      clientQuestions,
      operatorChecklist,
      publicSummary: entry.publicSummary,
      internalNotes,
      requiresAgencyConfirmation,
      requiresManualReview,
      canCoordinatePartner,
      canTransmit,
      canApostilleAfterResult,
      warnings,
    };
  }

  if (EMPLOYMENT_LICENSING_USE_CASES.includes(useCase)) {
    requiredAgencyInstruction = true;
    oriRequired = true;
    requiresAgencyConfirmation = true;
    allowedMethods.push("electronic_livescan", "agency_directed_vendor");
    operatorChecklist.push(
      "Confirm agency instructions are uploaded.",
      "Confirm ORI number is provided and matches the requesting agency."
    );
    clientQuestions.push(
      "Which agency or licensing board requested the fingerprints?",
      "Do you have the ORI number and agency instructions?"
    );

    if (!agencyInstructionsUploaded || !oriProvided) {
      requiresManualReview = true;
      canTransmit = false;
      blockedMethods.push("usps_fbi_electronic", "fbi_approved_channeler");
      warnings.push("Agency instructions / ORI required before submission");
    }
    warnings.push(
      "An FBI Identity History Summary is not a substitute for an employment/licensing background check."
    );
  } else if (FBI_IDENTITY_HISTORY_USE_CASES.includes(useCase)) {
    allowedMethods.push(
      "electronic_livescan",
      "usps_fbi_electronic",
      "fbi_approved_channeler",
      "hard_card_fd_258"
    );
    canApostilleAfterResult = true;
    operatorChecklist.push(
      "Confirm personal / foreign-use purpose.",
      "Confirm result delivery format for downstream apostille if requested."
    );
    clientQuestions.push("What is the destination or receiving authority?");
    warnings.push(
      "An FBI Identity History Summary is not a substitute for an employment/licensing background check."
    );
  } else if (useCase === "recruiter_group_intake") {
    requiresManualReview = true;
    requiresAgencyConfirmation = true;
    operatorChecklist.push("Group intake requires operator review and scheduling.");
    clientQuestions.push("How many individuals are in the group intake?");
    allowedMethods.push("mobile_partner_referral", "agency_directed_vendor");
  } else {
    allowedMethods.push("electronic_livescan", "mobile_partner_referral");
    operatorChecklist.push("Confirm receiving authority requirements.");
  }

  if (useCase === "concealed_weapon_license") {
    warnings.push("The Milano Seal does not provide firearms advice.");
  }

  if (useCase === "immigration_residency_citizenship") {
    warnings.push("The Milano Seal does not provide immigration advice.");
  }

  return {
    useCase,
    authorityType: entry.authorityType,
    requiredAgencyInstruction,
    oriRequired,
    oriProvided,
    allowedMethods,
    blockedMethods,
    clientQuestions,
    operatorChecklist,
    publicSummary: entry.publicSummary,
    internalNotes,
    requiresAgencyConfirmation,
    requiresManualReview,
    canCoordinatePartner,
    canTransmit,
    canApostilleAfterResult,
    warnings,
  };
}
