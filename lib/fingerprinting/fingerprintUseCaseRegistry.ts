import type { FingerprintUseCase } from "./types";

export interface FingerprintUseCaseEntry {
  useCase: FingerprintUseCase;
  label: string;
  authorityType: string;
  employmentOrLicensing: boolean;
  publicSummary: string;
}

export const fingerprintUseCaseRegistry: Record<
  FingerprintUseCase,
  FingerprintUseCaseEntry
> = {
  fbi_identity_history_summary: {
    useCase: "fbi_identity_history_summary",
    label: "FBI Identity History Summary",
    authorityType: "federal_identity_history",
    employmentOrLicensing: false,
    publicSummary:
      "Personal or foreign-use FBI Identity History Summary request coordination.",
  },
  state_employment_licensing: {
    useCase: "state_employment_licensing",
    label: "State Employment / Licensing",
    authorityType: "state_agency",
    employmentOrLicensing: true,
    publicSummary: "State employment or licensing background document routing.",
  },
  healthcare_license: {
    useCase: "healthcare_license",
    label: "Healthcare License",
    authorityType: "state_licensing_board",
    employmentOrLicensing: true,
    publicSummary: "Healthcare licensing fingerprint document routing.",
  },
  nursing_board: {
    useCase: "nursing_board",
    label: "Nursing Board",
    authorityType: "state_licensing_board",
    employmentOrLicensing: true,
    publicSummary: "Nursing board fingerprint document routing.",
  },
  medical_board: {
    useCase: "medical_board",
    label: "Medical Board",
    authorityType: "state_licensing_board",
    employmentOrLicensing: true,
    publicSummary: "Medical board fingerprint document routing.",
  },
  teacher_school_district: {
    useCase: "teacher_school_district",
    label: "Teacher / School District",
    authorityType: "school_district",
    employmentOrLicensing: true,
    publicSummary: "Teacher or school district fingerprint document routing.",
  },
  security_guard_license: {
    useCase: "security_guard_license",
    label: "Security Guard License",
    authorityType: "state_agency",
    employmentOrLicensing: true,
    publicSummary: "Security guard license fingerprint document routing.",
  },
  corrections_jail_applicant: {
    useCase: "corrections_jail_applicant",
    label: "Corrections / Jail Applicant",
    authorityType: "state_agency",
    employmentOrLicensing: true,
    publicSummary: "Corrections or jail applicant fingerprint document routing.",
  },
  real_estate_license: {
    useCase: "real_estate_license",
    label: "Real Estate License",
    authorityType: "state_licensing_board",
    employmentOrLicensing: true,
    publicSummary: "Real estate license fingerprint document routing.",
  },
  concealed_weapon_license: {
    useCase: "concealed_weapon_license",
    label: "Concealed Weapon License",
    authorityType: "state_agency",
    employmentOrLicensing: true,
    publicSummary: "Concealed weapon license fingerprint document routing.",
  },
  immigration_residency_citizenship: {
    useCase: "immigration_residency_citizenship",
    label: "Immigration / Residency / Citizenship",
    authorityType: "immigration_authority",
    employmentOrLicensing: false,
    publicSummary:
      "Immigration, residency, or citizenship fingerprint document coordination.",
  },
  professional_license_foreign_use: {
    useCase: "professional_license_foreign_use",
    label: "Professional License (Foreign Use)",
    authorityType: "foreign_authority",
    employmentOrLicensing: false,
    publicSummary: "Professional license fingerprint documents for foreign use.",
  },
  study_abroad: {
    useCase: "study_abroad",
    label: "Study Abroad",
    authorityType: "foreign_authority",
    employmentOrLicensing: false,
    publicSummary: "Study abroad fingerprint document coordination.",
  },
  adoption: {
    useCase: "adoption",
    label: "Adoption",
    authorityType: "foreign_or_domestic_authority",
    employmentOrLicensing: false,
    publicSummary: "Adoption fingerprint document coordination.",
  },
  visa_application: {
    useCase: "visa_application",
    label: "Visa Application",
    authorityType: "foreign_authority",
    employmentOrLicensing: false,
    publicSummary: "Visa application fingerprint document coordination.",
  },
  digital_nomad_residency: {
    useCase: "digital_nomad_residency",
    label: "Digital Nomad Residency",
    authorityType: "foreign_authority",
    employmentOrLicensing: false,
    publicSummary: "Digital nomad residency fingerprint document coordination.",
  },
  recruiter_group_intake: {
    useCase: "recruiter_group_intake",
    label: "Recruiter / Group Intake",
    authorityType: "group_intake",
    employmentOrLicensing: false,
    publicSummary: "Group or recruiter-directed fingerprint intake coordination.",
  },
  unknown: {
    useCase: "unknown",
    label: "Unknown",
    authorityType: "manual_review",
    employmentOrLicensing: false,
    publicSummary: "Use case requires manual review before routing.",
  },
};

export function getFingerprintUseCase(
  useCase: FingerprintUseCase
): FingerprintUseCaseEntry {
  return fingerprintUseCaseRegistry[useCase];
}
