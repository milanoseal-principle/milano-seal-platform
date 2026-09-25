// Provider-driven RON capability intelligence around the existing BlueNotary
// integration. Deterministic and projection-only: it never performs identity
// verification, never stores identity payloads, and never replaces the
// BlueNotary session lifecycle or the RON state machine.
//
// Capability truth comes from provider configuration (below), provider
// session records and operator-recorded evidence — never from model guesswork
// and never from the browser.

import { evaluateExecutionDocumentReadiness, type PreflightFileRow } from "./documentReadiness";
import {
  RON_IDENTITY_METHODS,
  type DocumentPreflightPosture,
  type ProviderEligibilityStatus,
  type RequirementPosture,
  type RonAuthorityAcceptance,
  type RonCapabilityStatus,
  type RonIdentityMethod,
  type RonProviderCapabilityResult,
} from "./types";

export interface RonProviderConfiguration {
  provider: string;
  label: string;
  /** Identity methods the configured provider integration actually runs. */
  supportedIdentityMethods: RonIdentityMethod[];
  defaultIdentityMethod: RonIdentityMethod;
  source: "provider_configuration";
  evidence: string;
}

/**
 * Provider configuration for the integrated RON provider. BlueNotary's
 * integration handles photo-ID (credential analysis), biometric and KBA
 * webhook outcomes (lib/bluenotary/status.ts) and creates signers with
 * authentication_type "kba" by default (lib/bluenotary/session.ts). Methods
 * the integration does not run (passport IDV, credible witness, generic
 * identity proofing) are deliberately absent until provider evidence exists.
 */
export const RON_PROVIDER_REGISTRY: Readonly<Record<string, RonProviderConfiguration>> = {
  bluenotary: {
    provider: "bluenotary",
    label: "BlueNotary",
    supportedIdentityMethods: ["credential_analysis", "biometric_idv", "kba"],
    defaultIdentityMethod: "kba",
    source: "provider_configuration",
    evidence:
      "BlueNotary webhook status map (photo_id / biometrics / kba events) and default signer authentication_type=kba.",
  },
};

export interface RonAuthorityPosture {
  receivingAuthority: string | null;
  receivingAuthorityRonAcceptance: RonAuthorityAcceptance;
  wetInkRequirement: RequirementPosture;
  originalRequirement: RequirementPosture;
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** Reads the operator-recorded RON posture from canonical execution truth. */
export function readRonAuthorityPosture(executionTruth: unknown): RonAuthorityPosture {
  const truth =
    executionTruth && typeof executionTruth === "object" && !Array.isArray(executionTruth)
      ? (executionTruth as Record<string, unknown>)
      : {};
  const authority = typeof truth.receiving_authority === "string" ? truth.receiving_authority.trim() : "";
  return {
    receivingAuthority: authority || null,
    receivingAuthorityRonAcceptance: oneOf(
      truth.receiving_authority_ron_acceptance,
      ["accepted", "not_accepted", "unknown"] as const,
      "unknown",
    ),
    wetInkRequirement: oneOf(truth.wet_ink_requirement, ["required", "not_required", "unknown"] as const, "unknown"),
    originalRequirement: oneOf(truth.original_requirement, ["required", "not_required", "unknown"] as const, "unknown"),
  };
}

export interface RonProviderSessionEvidence {
  id?: string | null;
  bn_session_id?: string | null;
  identity_status?: string | null;
  kba_status?: string | null;
  biometric_status?: string | null;
  milano_ron_status?: string | null;
}

export interface RonProviderCapabilityInput {
  matterId: string;
  provider: string;
  providerSession?: RonProviderSessionEvidence | null;
  signerLocation: string | null;
  documentType: string | null;
  notarialAct: string | null;
  posture: RonAuthorityPosture;
  /** Requested identity method (e.g. signer authentication_type). Validated against provider truth. */
  requestedIdentityMethod?: string | null;
  documentPreflight: DocumentPreflightPosture;
  schedulingAuthorized: boolean;
}

const RESOLVED_NOTARIAL_ACTS = new Set(["acknowledgment", "jurat", "oath_affirmation", "signature_witnessing", "other"]);

function statusOf(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

/**
 * Identity outcome as reported by the provider session. Only provider-safe
 * status words are read; raw identity payloads never reach this module.
 */
function providerIdentityStatus(session: RonProviderSessionEvidence | null | undefined, method: RonIdentityMethod | null) {
  if (!session) return "NOT_STARTED";
  const statuses = [session.identity_status, session.kba_status, session.biometric_status].map(statusOf);
  if (statuses.some((s) => s.includes("FAIL"))) return "FAILED";
  const methodStatus =
    method === "kba" ? statusOf(session.kba_status) : method === "biometric_idv" ? statusOf(session.biometric_status) : statusOf(session.identity_status);
  if (methodStatus.includes("PASS") || methodStatus === "VERIFIED" || methodStatus === "COMPLETED") return "VERIFIED";
  if (statuses.some((s) => s && s !== "NOT_STARTED")) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export function evaluateRonProviderCapability(
  input: RonProviderCapabilityInput,
  now: Date = new Date(),
): RonProviderCapabilityResult {
  const blockers: string[] = [];
  const reviewReasons: string[] = [];
  const provider = String(input.provider ?? "").trim().toLowerCase();
  const configuration = RON_PROVIDER_REGISTRY[provider];

  if (!input.schedulingAuthorized) {
    blockers.push("Payment / scheduling gate is not satisfied.");
  }

  // ── Document preflight ──
  if (input.documentPreflight === "BLOCKED") {
    blockers.push("An execution document failed structural preflight.");
  } else if (input.documentPreflight === "REVIEW_REQUIRED") {
    reviewReasons.push("An execution document requires preflight review.");
  } else if (input.documentPreflight === "NOT_RUN") {
    reviewReasons.push("Execution document preflight has not run.");
  }

  // ── Provider capability (provider configuration only) ──
  let selectedIdentityMethod: RonIdentityMethod | null = null;
  let providerEligibilityStatus: ProviderEligibilityStatus = "ELIGIBLE";
  if (!configuration) {
    blockers.push(`RON provider "${input.provider || "unknown"}" is not a configured provider.`);
    providerEligibilityStatus = "INELIGIBLE";
  } else {
    const requested = String(input.requestedIdentityMethod ?? "").trim().toLowerCase();
    if (requested) {
      const known = (RON_IDENTITY_METHODS as readonly string[]).includes(requested);
      if (known && configuration.supportedIdentityMethods.includes(requested as RonIdentityMethod)) {
        selectedIdentityMethod = requested as RonIdentityMethod;
      } else {
        blockers.push(`Identity method "${requested}" is not supported by the ${configuration.label} integration.`);
        providerEligibilityStatus = "INELIGIBLE";
      }
    } else {
      selectedIdentityMethod = configuration.defaultIdentityMethod;
    }
  }

  // ── Execution truth ──
  if (!input.notarialAct || !RESOLVED_NOTARIAL_ACTS.has(input.notarialAct)) {
    reviewReasons.push("Notarial act is unresolved; it is never inferred.");
  }
  if (!input.signerLocation) {
    reviewReasons.push("Signer location is unresolved.");
  }
  if (!input.documentType) {
    reviewReasons.push("Document type is unresolved.");
  }

  // ── Receiving authority / medium ──
  const { posture } = input;
  if (posture.wetInkRequirement === "required") {
    blockers.push("A wet-ink execution requirement is incompatible with RON.");
  } else if (posture.wetInkRequirement === "unknown") {
    reviewReasons.push("Wet-ink requirement has not been confirmed.");
  }
  if (posture.originalRequirement === "required") {
    blockers.push("A wet-ink original requirement is incompatible with RON.");
  } else if (posture.originalRequirement === "unknown") {
    reviewReasons.push("Original-document requirement has not been confirmed.");
  }
  if (posture.receivingAuthorityRonAcceptance === "not_accepted") {
    blockers.push("The receiving authority does not accept remote execution.");
  } else if (posture.receivingAuthorityRonAcceptance === "unknown") {
    reviewReasons.push("Receiving-authority acceptance of remote execution has not been confirmed.");
  }

  // ── Provider session evidence ──
  const identityStatus = providerIdentityStatus(input.providerSession, selectedIdentityMethod);
  if (identityStatus === "FAILED") {
    reviewReasons.push("The provider reported a failed identity step.");
  }
  if (providerEligibilityStatus === "ELIGIBLE" && reviewReasons.length > 0) {
    providerEligibilityStatus = "REVIEW_REQUIRED";
  }

  const status: RonCapabilityStatus = blockers.length
    ? "RON_BLOCKED"
    : reviewReasons.length
      ? "RON_OPERATOR_REVIEW_REQUIRED"
      : "RON_READY";
  const providerSessionId = input.providerSession?.bn_session_id ?? null;

  return {
    provider: configuration?.provider ?? (provider || "unknown"),
    providerSessionId,
    availableIdentityMethods: configuration ? [...configuration.supportedIdentityMethods] : [],
    selectedIdentityMethod,
    providerEligibilityStatus: blockers.length ? "INELIGIBLE" : providerEligibilityStatus,
    identityStatus,
    // Provider-safe reference only: the provider session id and the method,
    // never passport, MRZ, image, biometric or KBA content.
    identityEvidenceReference:
      providerSessionId && identityStatus !== "NOT_STARTED"
        ? `${configuration?.provider ?? provider}:session:${providerSessionId}:${selectedIdentityMethod ?? "unknown"}`
        : null,
    reviewRequired: status === "RON_OPERATOR_REVIEW_REQUIRED",
    reviewReasons,
    blockers,
    verifiedAt: identityStatus === "VERIFIED" ? now.toISOString() : null,
    status,
  };
}

/** Maps persisted file preflight rows to the capability posture. */
export function documentPreflightPosture(files: readonly PreflightFileRow[] | null | undefined): DocumentPreflightPosture {
  const readiness = evaluateExecutionDocumentReadiness(files);
  if (readiness.candidates.length === 0) return "NOT_RUN";
  if (readiness.ready) return "READY";
  if (readiness.unresolved.some((file) => file.status === "BLOCKED")) return "BLOCKED";
  if (readiness.unresolved.some((file) => file.status === "REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  return "NOT_RUN";
}

/** Columns persisted on ron_sessions. Nothing else from identity checks is stored. */
export function ronCapabilityEvidenceColumns(result: RonProviderCapabilityResult) {
  return {
    ron_provider: result.provider,
    selected_identity_method: result.selectedIdentityMethod,
    identity_evidence_reference: result.identityEvidenceReference,
    provider_eligibility_status: result.providerEligibilityStatus,
    capability_verified_at: result.verifiedAt,
  };
}
