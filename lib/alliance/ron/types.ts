export type RonCoverageStatus =
  | "REVIEW_REQUIRED"
  | "VERIFIED_AVAILABLE"
  | "VERIFIED_UNAVAILABLE"
  | "SUSPENDED";

export type RonVerificationLevel =
  | "LISTED"
  | "VERIFIED_NOTARY"
  | "RON_READY"
  | "EXECUTION_PARTNER"
  | "PRIORITY_DISPATCH_PARTNER";

export type RonDispatchReadiness =
  | "BLOCKED"
  | "REVIEW_REQUIRED"
  | "READY_STANDARD"
  | "READY_PRIORITY";

export interface RonStateRegistryEntry {
  code: string;
  state: string;
  priority: number;
  coverageStatus: RonCoverageStatus;
  lastVerifiedAt: string | null;
  sourceUrl: string | null;
  notes: string;
}

export interface RonPartnerRecord {
  id: string;
  fullName: string;
  email: string;
  stateCommissioned: string;
  commissionNumber: string | null;
  commissionExpiration: string | null;
  ronAuthorized: boolean;
  ronPlatforms: string[];
  mobileAvailable: boolean;
  languages: string[];
  availability: string | null;
  serviceArea: string | null;
  eoProvider: string | null;
  eoPolicyLimit: string | null;
  backgroundCheckStatus: string | null;
  apostilleExperience: boolean;
  internationalDocumentExperience: boolean;
  shippingDropoffAccess: boolean;
  status: string;
  reviewedAt: string | null;
  updatedAt: string | null;
}

export interface RonPartnerAssessment {
  level: RonVerificationLevel;
  readiness: RonDispatchReadiness;
  blockers: string[];
  strengths: string[];
}

export interface RonCoverageSummary {
  targetStates: number;
  statesWithApplicants: number;
  statesWithRonReadyPartners: number;
  totalApplicants: number;
  ronReadyPartners: number;
  mobileFallbackPartners: number;
  priorityDispatchPartners: number;
}
