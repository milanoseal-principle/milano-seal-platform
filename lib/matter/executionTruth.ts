export const NOTARIZATION_REQUIREMENTS = [
  "required",
  "not_required",
  "review_required",
] as const;
export type NotarizationRequirement = (typeof NOTARIZATION_REQUIREMENTS)[number];

export const EXECUTION_METHODS = [
  "ron",
  "in_person",
  "mobile",
  "already_notarized",
  "third_party_notary",
  "review_required",
] as const;
export type ExecutionMethod = (typeof EXECUTION_METHODS)[number];

export const NOTARIAL_ACTS = [
  "acknowledgment",
  "jurat",
  "oath_affirmation",
  "signature_witnessing",
  "other",
  "review_required",
] as const;
export type NotarialAct = (typeof NOTARIAL_ACTS)[number];

export const AUTHENTICATION_REQUIREMENTS = [
  "apostille",
  "authentication_legalization",
  "not_required",
  "review_required",
] as const;
export type AuthenticationRequirement =
  (typeof AUTHENTICATION_REQUIREMENTS)[number];

export const RON_VERIFICATION_STATUSES = [
  "required",
  "not_required",
  "completed",
  "failed",
  "review_required",
] as const;
export type RonVerificationStatus =
  (typeof RON_VERIFICATION_STATUSES)[number];

export interface CanonicalExecutionTruth {
  version: 1;
  notarization_requirement: NotarizationRequirement;
  execution_method: ExecutionMethod;
  notarial_act: NotarialAct;
  authentication_requirement: AuthenticationRequirement;
  signer_location: string | null;
  execution_location: string | null;
  assigned_notary: string | null;
  notary_jurisdiction: string | null;
  certificate_type: string | null;
  ron_kba_status: RonVerificationStatus | null;
  ron_credential_analysis_status: RonVerificationStatus | null;
}

export interface ExecutionTruthValidation {
  valid: boolean;
  reviewRequired: boolean;
  errors: string[];
}

function cleanOptional(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean || null;
}

function oneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

/**
 * Canonical execution truth constructor.
 *
 * No negative boolean is ever converted into a positive execution method.
 * In particular, mobile=false has no relationship to RON.
 */
export function normalizeExecutionTruth(
  input: Record<string, unknown>,
): CanonicalExecutionTruth {
  const nested =
    input.execution_truth &&
    typeof input.execution_truth === "object" &&
    !Array.isArray(input.execution_truth)
      ? (input.execution_truth as Record<string, unknown>)
      : {};
  const source = { ...input, ...nested };

  const notarizationRequirement = oneOf(
    source.notarization_requirement,
    NOTARIZATION_REQUIREMENTS,
    "review_required",
  );
  const executionMethod = oneOf(
    source.execution_method,
    EXECUTION_METHODS,
    "review_required",
  );
  const notarialAct = oneOf(
    source.notarial_act,
    NOTARIAL_ACTS,
    "review_required",
  );
  const authenticationRequirement = oneOf(
    source.authentication_requirement,
    AUTHENTICATION_REQUIREMENTS,
    "review_required",
  );

  return {
    version: 1,
    notarization_requirement: notarizationRequirement,
    execution_method: executionMethod,
    notarial_act: notarialAct,
    authentication_requirement: authenticationRequirement,
    signer_location: cleanOptional(source.signer_location),
    execution_location: cleanOptional(source.execution_location),
    assigned_notary: cleanOptional(source.assigned_notary),
    notary_jurisdiction: cleanOptional(source.notary_jurisdiction),
    certificate_type: cleanOptional(source.certificate_type),
    ron_kba_status:
      source.ron_kba_status == null
        ? null
        : oneOf(
            source.ron_kba_status,
            RON_VERIFICATION_STATUSES,
            "review_required",
          ),
    ron_credential_analysis_status:
      source.ron_credential_analysis_status == null
        ? null
        : oneOf(
            source.ron_credential_analysis_status,
            RON_VERIFICATION_STATUSES,
            "review_required",
          ),
  };
}

export function validateExecutionTruth(
  truth: CanonicalExecutionTruth,
): ExecutionTruthValidation {
  const errors: string[] = [];

  if (truth.notarization_requirement === "required") {
    if (truth.execution_method === "review_required") {
      errors.push("EXECUTION_METHOD_REVIEW_REQUIRED");
    }
    if (truth.execution_method === "already_notarized") {
      errors.push("NOTARIZATION_STATE_CONFLICT");
    }
    if (truth.notarial_act === "review_required") {
      errors.push("NOTARIAL_ACT_REVIEW_REQUIRED");
    }
  }

  if (
    truth.execution_method === "ron" &&
    truth.notarization_requirement !== "required"
  ) {
    errors.push("RON_REQUIRES_NOTARIZATION");
  }
  if (truth.execution_method === "ron") {
    if (!truth.signer_location) errors.push("RON_SIGNER_LOCATION_REQUIRED");
    if (!truth.ron_kba_status) errors.push("RON_KBA_STATUS_REQUIRED");
    if (!truth.ron_credential_analysis_status) {
      errors.push("RON_CREDENTIAL_ANALYSIS_STATUS_REQUIRED");
    }
  }

  if (
    (truth.execution_method === "mobile" ||
      truth.execution_method === "in_person") &&
    !truth.execution_location
  ) {
    errors.push("EXECUTION_LOCATION_REQUIRED");
  }

  if (truth.execution_method === "already_notarized") {
    if (truth.notarization_requirement === "required") {
      errors.push("ALREADY_NOTARIZED_CONFLICT");
    }
    if (!truth.notary_jurisdiction) {
      errors.push("NOTARY_JURISDICTION_REQUIRED");
    }
    if (!truth.certificate_type) {
      errors.push("CERTIFICATE_TYPE_REQUIRED");
    }
  }

  if (
    truth.execution_method === "third_party_notary" &&
    truth.notarization_requirement === "required" &&
    !truth.notary_jurisdiction
  ) {
    errors.push("THIRD_PARTY_NOTARY_JURISDICTION_REQUIRED");
  }

  const reviewRequired =
    truth.notarization_requirement === "review_required" ||
    truth.authentication_requirement === "review_required" ||
    (truth.notarization_requirement === "required" &&
      (truth.execution_method === "review_required" ||
        truth.notarial_act === "review_required")) ||
    truth.ron_kba_status === "review_required" ||
    truth.ron_credential_analysis_status === "review_required" ||
    truth.ron_kba_status === "failed" ||
    truth.ron_credential_analysis_status === "failed";

  return {
    valid: errors.length === 0,
    reviewRequired,
    errors,
  };
}

export function executionTruthToLegacy(truth: CanonicalExecutionTruth) {
  return {
    mobile: truth.execution_method === "mobile",
    ron_required: truth.execution_method === "ron",
    apostille_required: truth.authentication_requirement === "apostille",
    notarization_required: truth.notarization_requirement === "required",
  };
}

export function executionMethodForCompliance(
  truth: CanonicalExecutionTruth,
): "ron" | "mobile" | "in_person" | "already_notarized" | "third_party_notary" | "review_required" {
  return truth.execution_method;
}

export function executionQuoteReviewReasons(
  truth: CanonicalExecutionTruth,
): string[] {
  const validation = validateExecutionTruth(truth);
  const reasons = [...validation.errors];
  if (validation.reviewRequired && reasons.length === 0) {
    reasons.push("EXECUTION_REVIEW_REQUIRED");
  }
  return reasons;
}
