import { createHash } from "node:crypto";

// Canonical RON lifecycle. Mirrors public.is_valid_ron_lifecycle_transition
// and public.ron_session_missing_evidence in migration 20261108090000.
export const RON_LIFECYCLE_STATES = [
  "REQUESTED",
  "STARTED",
  "PROVIDER_ACCEPTED",
  "PROVIDER_SESSION_COMPLETED",
  "EVIDENCE_PENDING",
  "EVIDENCE_VERIFIED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export type RonLifecycleState = (typeof RON_LIFECYCLE_STATES)[number];

const TERMINAL: ReadonlySet<RonLifecycleState> = new Set(["COMPLETED", "FAILED", "CANCELLED"]);
const FORWARD: Record<RonLifecycleState, readonly RonLifecycleState[]> = {
  REQUESTED: ["STARTED", "PROVIDER_ACCEPTED", "PROVIDER_SESSION_COMPLETED"],
  STARTED: ["PROVIDER_ACCEPTED", "PROVIDER_SESSION_COMPLETED"],
  PROVIDER_ACCEPTED: ["STARTED", "PROVIDER_SESSION_COMPLETED"],
  PROVIDER_SESSION_COMPLETED: ["EVIDENCE_PENDING"],
  EVIDENCE_PENDING: ["EVIDENCE_VERIFIED"],
  EVIDENCE_VERIFIED: ["EVIDENCE_PENDING", "COMPLETED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function isRonLifecycleState(value: unknown): value is RonLifecycleState {
  return typeof value === "string" && (RON_LIFECYCLE_STATES as readonly string[]).includes(value);
}

export function isTerminalRonLifecycle(state: RonLifecycleState) {
  return TERMINAL.has(state);
}

export function isValidRonLifecycleTransition(from: RonLifecycleState, to: RonLifecycleState) {
  if (from === to) return true;
  if (TERMINAL.has(from)) return false;
  if (to === "FAILED" || to === "CANCELLED") return true;
  return FORWARD[from].includes(to);
}

// Provider events can only ever move the lifecycle up to PROVIDER_SESSION_COMPLETED
// or FAILED. Evidence verification and completion are Milano-only actions.
const PROVIDER_EVENT_LIFECYCLE: Record<string, RonLifecycleState> = {
  open_call_accepted: "PROVIDER_ACCEPTED",
  join_session: "STARTED",
  session_started: "STARTED",
  session_completed: "PROVIDER_SESSION_COMPLETED",
  session_expired: "FAILED",
};

export function providerEventLifecycle(
  current: RonLifecycleState,
  providerEvent: string,
): RonLifecycleState | null {
  const target = PROVIDER_EVENT_LIFECYCLE[providerEvent];
  if (!target || target === current) return null;
  return isValidRonLifecycleTransition(current, target) ? target : null;
}

export const RON_EVIDENCE_CODES = [
  "MATTER_NOT_FOUND",
  "PROVIDER_NAME",
  "PROVIDER_SESSION_REFERENCE",
  "NOTARY_IDENTITY",
  "NOTARY_COMMISSION",
  "NOTARY_COMMISSION_EXPIRED",
  "NOTARIAL_ACT_TYPE",
  "NOTARIAL_ACT_COUNT",
  "CERTIFICATE_COMPLETION",
  "ELECTRONIC_SIGNATURE",
  "ELECTRONIC_SEAL",
  "EXECUTION_TIMESTAMP",
  "JOURNAL_REFERENCE",
  "AV_RECORDING_REFERENCE",
  "RETENTION_METADATA",
  "PROVIDER_EVIDENCE_REFERENCES",
  "EXCEPTION_OPEN",
  "WITNESS_REQUIREMENT_REVIEW",
  "WITNESS_EVIDENCE",
  "SIGNER_REFERENCE",
  "SIGNER_LOCATION_EVIDENCE",
  "IDENTITY_PROOFING",
  "CREDENTIAL_ANALYSIS",
  "KBA",
  "AWARENESS_WILLINGNESS",
  "OATH_AFFIRMATION",
  "EXECUTED_DOCUMENT",
  "EXECUTED_DOCUMENT_HASH",
  "CUSTODY_LINKAGE",
  "OPERATOR_VERIFICATION",
  "QC_EVIDENCE",
  "MILANO_COMPLETION_ACTOR",
] as const;
export type RonEvidenceCode = (typeof RON_EVIDENCE_CODES)[number];

// External provider-controlled fee evidence — NOT a Milano charge. It carries no amount, never enters
// Milano pricing/quote/invoice/Wise/discount/revenue truth, and grants no payment authority.
export const EXTERNAL_PROVIDER_NOTARIAL_FEE = "EXTERNAL_PROVIDER_NOTARIAL_FEE" as const;
export const RON_STATUTORY_RETENTION_CLASS = "RON_STATUTORY_EVIDENCE" as const;

export interface RonSessionEvidence {
  provider_name?: string | null;
  bn_session_id?: string | null;
  notary_name?: string | null;
  notary_commission_number?: string | null;
  notary_commission_jurisdiction?: string | null;
  notary_commission_expires_on?: string | null;
  notarial_act_type?: string | null;
  notarial_act_count?: number | null;
  certificate_completion_reference?: string | null;
  electronic_signature_reference?: string | null;
  electronic_seal_reference?: string | null;
  execution_completed_at?: string | null;
  journal_reference?: string | null;
  av_recording_reference?: string | null;
  provider_fee_evidence_classification?: string | null;
  provider_fee_evidence_reference?: string | null;
  retention_class?: string | null;
  retention_rule?: string | null;
  retention_start_at?: string | null;
  provider_evidence_references?: unknown;
  exception_status?: string | null;
  witness_requirement?: string | null;
  qc_status?: string | null;
  qc_review_reference?: string | null;
  evidence_verified_at?: string | null;
  evidence_verified_by?: string | null;
  evidence_verification_hash?: string | null;
  completed_at?: string | null;
  milano_completed_by?: string | null;
}

export interface RonSignerEvidence {
  id?: string;
  party_role?: string | null;
  signer_reference?: string | null;
  signer_location_jurisdiction?: string | null;
  signer_location_evidence_reference?: string | null;
  identity_proofing_result?: string | null;
  identity_proofing_reference?: string | null;
  credential_analysis_result?: string | null;
  credential_analysis_reference?: string | null;
  kba_result?: string | null;
  kba_reference?: string | null;
  awareness_willingness_confirmed_at?: string | null;
  awareness_willingness_reference?: string | null;
  oath_administered_at?: string | null;
  oath_reference?: string | null;
  witness_appearance?: string | null;
  witness_evidence_reference?: string | null;
}

export interface RonDocumentEvidence {
  id?: string;
  signed_document_received?: boolean | null;
  executed_sha256?: string | null;
  executed_document_version_id?: string | null;
  custody_ledger_hash?: string | null;
}

export interface RonEvidenceInput {
  matterFound: boolean;
  executionTruth: Record<string, unknown> | null;
  session: RonSessionEvidence;
  signers: RonSignerEvidence[];
  documents: RonDocumentEvidence[];
}

const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value != null;

export function evaluateRonStatutoryEvidence(
  input: RonEvidenceInput,
  stage: "verify" | "complete" = "verify",
): RonEvidenceCode[] {
  const missing = new Set<RonEvidenceCode>();
  const s = input.session;
  const truth = input.executionTruth ?? {};
  if (!input.matterFound) missing.add("MATTER_NOT_FOUND");
  const act = present(s.notarial_act_type) ? String(s.notarial_act_type).trim() : (typeof truth.notarial_act === "string" ? truth.notarial_act : null);

  if (!present(s.provider_name)) missing.add("PROVIDER_NAME");
  if (!present(s.bn_session_id)) missing.add("PROVIDER_SESSION_REFERENCE");
  if (!present(s.notary_name)) missing.add("NOTARY_IDENTITY");
  if (!present(s.notary_commission_number) || !present(s.notary_commission_jurisdiction) || !present(s.notary_commission_expires_on)) {
    missing.add("NOTARY_COMMISSION");
  } else if (s.execution_completed_at && String(s.notary_commission_expires_on) < String(s.execution_completed_at).slice(0, 10)) {
    missing.add("NOTARY_COMMISSION_EXPIRED");
  }
  if (!act || act === "review_required" || act === "unknown") missing.add("NOTARIAL_ACT_TYPE");
  if (!s.notarial_act_count || s.notarial_act_count < 1) missing.add("NOTARIAL_ACT_COUNT");
  if (!present(s.certificate_completion_reference)) missing.add("CERTIFICATE_COMPLETION");
  if (!present(s.electronic_signature_reference)) missing.add("ELECTRONIC_SIGNATURE");
  if (!present(s.electronic_seal_reference)) missing.add("ELECTRONIC_SEAL");
  if (!present(s.execution_completed_at)) missing.add("EXECUTION_TIMESTAMP");
  if (!present(s.journal_reference)) missing.add("JOURNAL_REFERENCE");
  if (!present(s.av_recording_reference)) missing.add("AV_RECORDING_REFERENCE");
  if (!present(s.retention_class) || !present(s.retention_rule) || !present(s.retention_start_at)) missing.add("RETENTION_METADATA");
  if (!Array.isArray(s.provider_evidence_references) || s.provider_evidence_references.length < 1) missing.add("PROVIDER_EVIDENCE_REFERENCES");
  if (s.exception_status === "open") missing.add("EXCEPTION_OPEN");

  const witnessRequirement = s.witness_requirement ?? "review_required";
  if (witnessRequirement === "review_required") missing.add("WITNESS_REQUIREMENT_REVIEW");
  else if (witnessRequirement === "required" && !input.signers.some((w) =>
    w.party_role === "witness" && present(w.witness_evidence_reference) && present(w.witness_appearance))) {
    missing.add("WITNESS_EVIDENCE");
  }

  const principals = input.signers.filter((p) => (p.party_role ?? "principal") === "principal");
  if (principals.length === 0) missing.add("SIGNER_REFERENCE");
  const caRequired = (truth.ron_credential_analysis_status ?? "required") !== "not_required";
  const kbaRequired = (truth.ron_kba_status ?? "required") !== "not_required";
  const oathRequired = act === "jurat" || act === "oath_affirmation";
  for (const p of principals) {
    if (!present(p.signer_reference)) missing.add("SIGNER_REFERENCE");
    if (!present(p.signer_location_jurisdiction) || !present(p.signer_location_evidence_reference)) missing.add("SIGNER_LOCATION_EVIDENCE");
    if (p.identity_proofing_result !== "passed" || !present(p.identity_proofing_reference)) missing.add("IDENTITY_PROOFING");
    if (caRequired && (p.credential_analysis_result !== "passed" || !present(p.credential_analysis_reference))) missing.add("CREDENTIAL_ANALYSIS");
    if (kbaRequired && (p.kba_result !== "passed" || !present(p.kba_reference))) missing.add("KBA");
    if (!present(p.awareness_willingness_confirmed_at) || !present(p.awareness_willingness_reference)) missing.add("AWARENESS_WILLINGNESS");
    if (oathRequired && (!present(p.oath_administered_at) || !present(p.oath_reference))) missing.add("OATH_AFFIRMATION");
  }

  if (!input.documents.some((d) => present(d.executed_sha256) && present(d.executed_document_version_id))) missing.add("EXECUTED_DOCUMENT");
  if (input.documents.some((d) => d.signed_document_received === true && !present(d.executed_sha256))) missing.add("EXECUTED_DOCUMENT_HASH");
  if (input.documents.some((d) => present(d.executed_sha256) && !present(d.custody_ledger_hash))) missing.add("CUSTODY_LINKAGE");

  if (stage === "complete") {
    if (!present(s.evidence_verified_at) || !present(s.evidence_verified_by) || !present(s.evidence_verification_hash)) missing.add("OPERATOR_VERIFICATION");
    if (s.qc_status !== "passed" || !present(s.qc_review_reference)) missing.add("QC_EVIDENCE");
  }
  return RON_EVIDENCE_CODES.filter((code) => missing.has(code));
}

// Florida RON journal/recording retention is governed at 10 years. Any other
// commissioning jurisdiction is left REVIEW_REQUIRED rather than guessed.
export function resolveRonRetention(commissionJurisdiction: string | null | undefined, executionAt: string | null | undefined) {
  const jurisdiction = String(commissionJurisdiction ?? "").trim().toUpperCase();
  if (!executionAt) return { retention_rule: "REVIEW_REQUIRED", retention_until: null as string | null };
  if (jurisdiction === "FL" || jurisdiction === "FLORIDA") {
    const until = new Date(executionAt);
    until.setUTCFullYear(until.getUTCFullYear() + 10);
    return { retention_rule: "FL_RON_10Y", retention_until: until.toISOString() };
  }
  return { retention_rule: "REVIEW_REQUIRED", retention_until: null as string | null };
}

export function ronEvidenceSnapshotHash(input: RonEvidenceInput) {
  const canonical = JSON.stringify({
    session: Object.fromEntries(Object.entries(input.session).sort(([a], [b]) => a.localeCompare(b))),
    signers: [...input.signers].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    documents: [...input.documents].sort((a, b) => String(a.id).localeCompare(String(b.id))),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

// Operator-writable evidence fields. Everything else on the RON tables is
// provider- or system-authored and cannot be written through the evidence API.
export const SESSION_EVIDENCE_FIELDS = [
  "notary_name",
  "notary_provider_reference",
  "notary_commission_number",
  "notary_commission_jurisdiction",
  "notary_commission_expires_on",
  "notary_ron_registration_reference",
  "notarial_act_type",
  "notarial_act_count",
  "certificate_completion_reference",
  "electronic_signature_reference",
  "electronic_seal_reference",
  "witness_requirement",
  "execution_completed_at",
  "journal_reference",
  "av_recording_reference",
  "provider_evidence_references",
  "provider_fee_evidence_reference",
] as const;
export const SESSION_REVIEW_FIELDS = ["qc_status", "qc_review_reference", "exception_status", "exception_reason"] as const;
export const SIGNER_EVIDENCE_FIELDS = [
  "party_role",
  "signer_reference",
  "signer_location_jurisdiction",
  "signer_location_evidence_reference",
  "identity_proofing_result",
  "identity_proofing_reference",
  "credential_analysis_result",
  "credential_analysis_reference",
  "kba_result",
  "kba_reference",
  "awareness_willingness_confirmed_at",
  "awareness_willingness_reference",
  "oath_administered_at",
  "oath_reference",
  "witness_appearance",
  "witness_evidence_reference",
] as const;

const ENUMS: Record<string, readonly string[]> = {
  witness_requirement: ["required", "not_required", "review_required"],
  notarial_act_type: ["acknowledgment", "jurat", "oath_affirmation", "signature_witnessing", "other"],
  qc_status: ["pending", "passed", "failed"],
  exception_status: ["none", "open", "resolved"],
  party_role: ["principal", "witness"],
  identity_proofing_result: ["passed", "failed", "not_required"],
  credential_analysis_result: ["passed", "failed", "not_required"],
  kba_result: ["passed", "failed", "not_required"],
  witness_appearance: ["remote", "physical"],
};
const TIMESTAMP_FIELDS = new Set(["execution_completed_at", "awareness_willingness_confirmed_at", "oath_administered_at"]);
// Evidence is stored as a governed reference/result, never as raw identity material.
const RAW_SENSITIVE = /(data:[a-z]+\/[a-z0-9.+-]+;base64,|^[A-Za-z0-9+/=]{400,}$|\b\d{3}-\d{2}-\d{4}\b|kba_answer|password|secret)/i;
const MAX_REFERENCE_LENGTH = 512;

export type EvidencePatchResult =
  | { ok: true; values: Record<string, unknown> }
  | { ok: false; field: string; code: string };

export function sanitizeEvidencePatch(
  patch: Record<string, unknown>,
  allowed: readonly string[],
): EvidencePatchResult {
  const values: Record<string, unknown> = {};
  for (const [field, raw] of Object.entries(patch)) {
    if (!allowed.includes(field)) return { ok: false, field, code: "FIELD_NOT_WRITABLE" };
    if (raw === null) { values[field] = null; continue; }
    if (field === "notarial_act_count") {
      if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1 || raw > 500) return { ok: false, field, code: "INVALID_ACT_COUNT" };
      values[field] = raw; continue;
    }
    if (field === "provider_evidence_references") {
      if (!Array.isArray(raw) || raw.length > 50 || raw.some((r) => typeof r !== "string" || !r.trim() || r.length > MAX_REFERENCE_LENGTH || RAW_SENSITIVE.test(r))) {
        return { ok: false, field, code: "INVALID_REFERENCE_LIST" };
      }
      values[field] = raw.map((r: string) => r.trim()); continue;
    }
    if (typeof raw !== "string") return { ok: false, field, code: "INVALID_TYPE" };
    const value = raw.trim();
    if (!value) { values[field] = null; continue; }
    if (ENUMS[field] && !ENUMS[field].includes(value)) return { ok: false, field, code: "INVALID_VALUE" };
    if (TIMESTAMP_FIELDS.has(field) && Number.isNaN(Date.parse(value))) return { ok: false, field, code: "INVALID_TIMESTAMP" };
    if (field === "notary_commission_expires_on" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, field, code: "INVALID_DATE" };
    if (value.length > MAX_REFERENCE_LENGTH || RAW_SENSITIVE.test(value)) return { ok: false, field, code: "RAW_SENSITIVE_MATERIAL_REJECTED" };
    values[field] = TIMESTAMP_FIELDS.has(field) ? new Date(value).toISOString() : value;
  }
  return { ok: true, values };
}

export type ExecutedCaptureDecision = "capture" | "duplicate" | "conflict";

// Duplicate retrieval never replaces captured executed evidence.
export function decideExecutedCapture(
  existing: { signed_document_received?: boolean | null; executed_sha256?: string | null } | null,
  sha256: string,
): ExecutedCaptureDecision {
  if (!existing?.signed_document_received) return "capture";
  return existing.executed_sha256 === sha256 ? "duplicate" : "conflict";
}

export function executedArtifactPath(matterId: string, sessionId: string, sha256: string, safeName: string) {
  return `ron/${matterId}/${sessionId}/executed/${sha256}/${safeName}`;
}

// Non-RON Matters never inherit RON blockers.
export function ronExecutionExitBlocker(
  executionTruth: Record<string, unknown> | null | undefined,
  sessions: Array<{ ron_lifecycle_state?: string | null }>,
): "RON_COMPLETION_REQUIRED_BEFORE_EXECUTION_EXIT" | null {
  if ((executionTruth ?? {}).execution_method !== "ron") return null;
  return sessions.some((s) => s.ron_lifecycle_state === "COMPLETED") ? null : "RON_COMPLETION_REQUIRED_BEFORE_EXECUTION_EXIT";
}

export function clientRonLifecycleLabel(state: RonLifecycleState | null | undefined) {
  switch (state) {
    case "COMPLETED": return "Notarization complete — execution evidence verified";
    case "EVIDENCE_VERIFIED": return "Execution evidence verified — final review in progress";
    case "EVIDENCE_PENDING":
    case "PROVIDER_SESSION_COMPLETED": return "Session received — Milano is verifying the execution record";
    case "FAILED": return "Session did not complete — your coordinator will contact you";
    case "CANCELLED": return "Session cancelled — your coordinator will contact you";
    case "STARTED":
    case "PROVIDER_ACCEPTED": return "Session in progress";
    default: return "Session requested";
  }
}
