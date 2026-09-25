// Shared execution-brain types. Projections only: none of these types is a
// second Matter, state machine or payment record.

export type ExecutionBrainStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";

/** Persisted document preflight status, plus NOT_RUN for a never-scanned document. */
export type DocumentPreflightPosture = "READY" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_RUN";

export const RON_IDENTITY_METHODS = [
  "credential_analysis",
  "identity_proofing",
  "kba",
  "biometric_idv",
  "passport_idv",
  "credible_witness",
  "other_provider_supported_method",
] as const;
export type RonIdentityMethod = (typeof RON_IDENTITY_METHODS)[number];

export type RonCapabilityStatus =
  | "RON_READY"
  | "RON_OPERATOR_REVIEW_REQUIRED"
  | "RON_BLOCKED";

export type ProviderEligibilityStatus = "ELIGIBLE" | "REVIEW_REQUIRED" | "INELIGIBLE";

/** Operator-recorded receiving-authority posture for remote execution. */
export type RonAuthorityAcceptance = "accepted" | "not_accepted" | "unknown";
export type RequirementPosture = "required" | "not_required" | "unknown";

export interface RonProviderCapabilityResult {
  provider: string;
  providerSessionId: string | null;
  availableIdentityMethods: RonIdentityMethod[];
  selectedIdentityMethod: RonIdentityMethod | null;
  providerEligibilityStatus: ProviderEligibilityStatus;
  identityStatus: string;
  identityEvidenceReference: string | null;
  reviewRequired: boolean;
  reviewReasons: string[];
  blockers: string[];
  verifiedAt: string | null;
  status: RonCapabilityStatus;
}
