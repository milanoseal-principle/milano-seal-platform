// Governed authority packet composer: one Matter-linked PROJECTION over
// canonical truth — the Matter, execution truth, the official authority asset
// registry, document preflight, RON/execution evidence, paper-out controls,
// state authority provenance and custody evidence.
//
// This is NOT a legal-document generator, a government-form generator, a
// drafting engine, a replacement authority system or a second Matter state
// machine. It never rewrites or signs an official form, never invents a fee,
// payment instrument, payee or address, never declares legal sufficiency and
// never asserts authority acceptance. The government fee is PASS_THROUGH and
// is never Milano service revenue. Client payment truth remains Wise.

import { MATTER_STATES } from "@/data/matter-state-machine";
import { getHagueCountryProfile } from "@/lib/milano-seal/global-acceptance/hague-country-registry";
import { evaluateExecutionDocumentReadiness, type PreflightFileRow } from "./documentReadiness";
import { readPaperOutChecklist } from "./paperOut";
import {
  FLORIDA_DOS_APOSTILLE_FORM,
  authorityStateFee,
  evaluateStateAuthority,
  resolveOfficialAsset,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "./stateAuthorityProvenance";

export const AUTHORITY_PACKET_STATUSES = [
  "NOT_READY",
  "REVIEW_REQUIRED",
  "READY_TO_ASSEMBLE",
  "ASSEMBLED",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
] as const;
export type AuthorityPacketStatus = (typeof AUTHORITY_PACKET_STATUSES)[number];

export const PACKET_ROUTE_TYPES = ["florida_dos_apostille", "florida_dos_notarial_certificate"] as const;
export type PacketRouteType = (typeof PACKET_ROUTE_TYPES)[number];

/** Government-fee payment readiness. NOT client payment truth (Wise is canonical). */
export const PACKET_FEE_PAYMENT_METHOD_STATUSES = ["UNKNOWN", "REQUIRED", "READY", "NOT_REQUIRED"] as const;
export type PacketFeePaymentMethodStatus = (typeof PACKET_FEE_PAYMENT_METHOD_STATUSES)[number];

export const RETURN_SHIPMENT_MODES = ["outbound_only", "outbound_prepaid_return", "manual_return", "unknown"] as const;
export type ReturnShipmentMode = (typeof RETURN_SHIPMENT_MODES)[number];

export const PACKET_QA_CONFIRMATIONS = [
  "document_count_confirmed",
  "official_form_confirmed",
  "authority_confirmed",
  "fees_confirmed",
  "payment_instrument_confirmed",
  "return_shipping_confirmed",
  "destination_confirmed",
  "paper_out_confirmed",
] as const;
export type PacketQaConfirmation = (typeof PACKET_QA_CONFIRMATIONS)[number];

export const FLORIDA_FORM_VERIFICATION_REASON =
  "Current Florida DOS form requires operator verification before packet assembly.";

/** Canonical custody event that evidences dispatch to the authority. */
export const AUTHORITY_DISPATCH_CUSTODY_EVENT = "DOC_APOSTILLE_SUBMITTED";

/**
 * Committed repository assets and their registered hashes. The unit test
 * proves each file on disk matches; a registry row that disagrees is blocked.
 */
export const REGISTERED_REPOSITORY_ASSET_HASHES: Readonly<Record<string, string>> = {
  [FLORIDA_DOS_APOSTILLE_FORM.repositoryPath]: FLORIDA_DOS_APOSTILLE_FORM.sha256,
};

export type PacketCheckKey =
  | "matter_exists"
  | "route_type_resolved"
  | "authority_resolved"
  | "official_form_current"
  | "source_documents_present"
  | "document_preflight_ready"
  | "execution_complete"
  | "ron_execution_evidence"
  | "paper_out_satisfied"
  | "authentication_route_consistent"
  | "government_fee_known"
  | "government_fee_source_current"
  | "government_fee_payment_method_known"
  | "destination_confirmed"
  | "document_count_confirmed"
  | "outbound_shipment_resolved"
  | "return_shipment_resolved"
  | "blocking_exception_absent";

export type PacketCheckResult = "PASS" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_APPLICABLE";

export interface PacketCheck {
  key: PacketCheckKey;
  label: string;
  result: PacketCheckResult;
  detail: string;
}

export type PacketDocumentRole =
  | "source_document"
  | "supporting_certificate"
  | "paper_out_certificate"
  | "translation"
  | "authority_instruction_attachment"
  | "other";

export interface PacketFileRow extends PreflightFileRow {
  category?: string | null;
  sha256?: string | null;
  storage_path?: string | null;
}

export interface PacketDocument {
  document_id: string;
  filename: string;
  document_type: string | null;
  preflight_status: string;
  execution_status: "EXECUTED" | "PENDING_EXECUTION" | "NOT_REQUIRED";
  sha256: string | null;
  reference: string | null;
  packet_role: PacketDocumentRole;
}

export interface PacketQa {
  document_count_confirmed: boolean;
  official_form_confirmed: boolean;
  authority_confirmed: boolean;
  fees_confirmed: boolean;
  payment_instrument_confirmed: boolean;
  return_shipping_confirmed: boolean;
  destination_confirmed: boolean;
  paper_out_confirmed: boolean;
  operator_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

/** Operator-recorded packet state stored in execution_truth.authority_packet. */
export interface RecordedAuthorityPacket {
  authority_id: string | null;
  route_type: PacketRouteType | null;
  document_count: number | null;
  government_fee_payment_method: PacketFeePaymentMethodStatus;
  return_shipment_mode: ReturnShipmentMode;
  paper_out_not_applicable_at: string | null;
  evaluated_at: string | null;
  assembled_at: string | null;
  assembled_by: string | null;
  qa: PacketQa | null;
  dispatch_ready_at: string | null;
  dispatch_approved_by: string | null;
}

export interface CustodyEvidenceRow {
  event: string;
  created_at: string;
}

export interface AuthorityPacketInput {
  matterId: string;
  matterState?: string | null;
  destinationCountry?: string | null;
  documentType?: string | null;
  executionTruth: unknown;
  files: readonly PacketFileRow[] | null | undefined;
  ronSessionStatus?: string | null;
  authority: StateAuthorityRecord | null;
  assets: readonly AuthoritySourceAsset[] | null | undefined;
  custodyEvents?: readonly CustodyEvidenceRow[] | null;
  /** Issuing lane from route intelligence; a federal document never takes a state apostille route. */
  issuingLane?: "state" | "federal" | "unresolved" | null;
}

export interface AuthorityPacketProjection {
  matterId: string;
  authorityId: string | null;
  routeType: PacketRouteType | null;
  destinationCountry: string | null;
  documentCount: number | null;
  officialFormAsset: {
    id: string;
    title: string;
    repositoryPath: string | null;
    officialSourceUrl: string | null;
    sourceVersion: string | null;
    sha256: string | null;
    resolution: string;
  } | null;
  sourceDocuments: PacketDocument[];
  paperOutEvidence: { applicability: "REQUIRED" | "NOT_APPLICABLE" | "UNRESOLVED"; basis: string; status: string; operatorApprovedAt: string | null };
  authorityFee: number | null;
  authorityFeeCurrency: "USD";
  authorityFeeSourceStatus: "VERIFIED" | "STALE" | "UNVERIFIED" | "MISSING";
  authorityFeeTreatment: "PASS_THROUGH";
  countsAsMilanoRevenue: false;
  paymentMethodStatus: PacketFeePaymentMethodStatus;
  outboundShippingRequired: boolean | null;
  returnShippingRequired: boolean | null;
  returnShipmentMode: ReturnShipmentMode;
  operatorQa: PacketQa & { complete: boolean };
  packetStatus: AuthorityPacketStatus;
  checks: PacketCheck[];
  missingItems: string[];
  reviewReasons: string[];
  blockers: string[];
  warnings: string[];
  createdAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
}

const RON_EXECUTION_COMPLETE = new Set(["RON_COMPLETED", "SIGNED_DOCS_RETRIEVED", "READY_FOR_APOSTILLE"]);
const EXCEPTION_STATES = new Set(["needs_client_info", "document_correction_required", "apostille_rejected", "dormant", "lost", "cancelled"]);
const EXECUTION_COMPLETE_INDEX = MATTER_STATES.indexOf("ron_completed");
/** Wet-ink execution creates no electronic record, so paper-out does not apply by rule. */
const PAPER_OUT_NOT_APPLICABLE_BY_RULE = new Set(["in_person", "mobile"]);
const HOLD_EVENTS = new Set(["PROTECTED_IDENTIFIER_MISMATCH", "PROTECTED_IDENTIFIER_RELEASE_HOLD"]);
const HOLD_CLEARING_EVENTS = new Set(["PROTECTED_IDENTIFIER_VERIFIED", "PROTECTED_IDENTIFIER_LOCKED"]);

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
const time = (value: string | null | undefined) => {
  const parsed = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(parsed) ? null : parsed;
};

/** Execution completion from canonical evidence only (RON session or Matter state). */
export function executionCompleted(matterState: string | null | undefined, ronSessionStatus: string | null | undefined) {
  if (ronSessionStatus && RON_EXECUTION_COMPLETE.has(ronSessionStatus)) return true;
  if (!matterState || EXCEPTION_STATES.has(matterState)) return false;
  return (MATTER_STATES as readonly string[]).indexOf(matterState) >= EXECUTION_COMPLETE_INDEX;
}

function readQa(raw: unknown): PacketQa | null {
  const qa = asObject(raw);
  if (Object.keys(qa).length === 0) return null;
  const flags = Object.fromEntries(PACKET_QA_CONFIRMATIONS.map((key) => [key, qa[key] === true])) as Record<PacketQaConfirmation, boolean>;
  return { ...flags, operator_note: str(qa.operator_note), approved_by: str(qa.approved_by), approved_at: str(qa.approved_at) };
}

/** Reads operator-recorded packet state from execution truth (whitelisted). */
export function readRecordedAuthorityPacket(executionTruth: unknown): RecordedAuthorityPacket | null {
  const raw = asObject(executionTruth).authority_packet;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const packet = raw as Record<string, unknown>;
  const count = Number(packet.document_count);
  return {
    authority_id: str(packet.authority_id),
    route_type: oneOf(packet.route_type, [...PACKET_ROUTE_TYPES, ""] as const, "") || null,
    document_count: Number.isInteger(count) && count > 0 ? count : null,
    government_fee_payment_method: oneOf(packet.government_fee_payment_method, PACKET_FEE_PAYMENT_METHOD_STATUSES, "UNKNOWN"),
    return_shipment_mode: oneOf(packet.return_shipment_mode, RETURN_SHIPMENT_MODES, "unknown"),
    paper_out_not_applicable_at: str(packet.paper_out_not_applicable_at),
    evaluated_at: str(packet.evaluated_at),
    assembled_at: str(packet.assembled_at),
    assembled_by: str(packet.assembled_by),
    qa: readQa(packet.qa),
    dispatch_ready_at: str(packet.dispatch_ready_at),
    dispatch_approved_by: str(packet.dispatch_approved_by),
  };
}

function packetRole(file: PacketFileRow): PacketDocumentRole {
  const category = String(file.category ?? "").toLowerCase();
  if (/paper[-_ ]?out/.test(category)) return "paper_out_certificate";
  if (/translat/.test(category)) return "translation";
  if (/instruction|cover/.test(category)) return "authority_instruction_attachment";
  if (/certificate/.test(category)) return "supporting_certificate";
  return "source_document";
}

function qaComplete(qa: PacketQa | null): boolean {
  return Boolean(qa && PACKET_QA_CONFIRMATIONS.every((key) => qa[key]) && qa.approved_by && qa.approved_at && qa.operator_note);
}

/** Active blocking exceptions from canonical Matter state and custody holds. */
export function activeMatterExceptions(matterState: string | null | undefined, custody: readonly CustodyEvidenceRow[] | null | undefined) {
  const exceptions: string[] = [];
  if (matterState && EXCEPTION_STATES.has(matterState)) exceptions.push(`Matter is in ${matterState.replaceAll("_", " ")}.`);
  const identifierEvents = (custody ?? [])
    .filter((row) => HOLD_EVENTS.has(row.event) || HOLD_CLEARING_EVENTS.has(row.event))
    .sort((a, b) => (time(a.created_at) ?? 0) - (time(b.created_at) ?? 0));
  const latest = identifierEvents.at(-1);
  if (latest && HOLD_EVENTS.has(latest.event)) exceptions.push("A protected-identifier hold is unresolved.");
  return exceptions;
}

export function composeAuthorityPacket(input: AuthorityPacketInput, now: Date = new Date()): AuthorityPacketProjection {
  const truth = asObject(input.executionTruth);
  const recorded = readRecordedAuthorityPacket(truth);
  const checks: PacketCheck[] = [];
  const warnings: string[] = [];
  const add = (key: PacketCheckKey, label: string, result: PacketCheckResult, detail: string) =>
    checks.push({ key, label, result, detail });

  add("matter_exists", "Matter exists", "PASS", "Canonical Matter record.");

  // ── Route + authority ──
  const routeType = recorded?.route_type ?? null;
  add(
    "route_type_resolved",
    "Route type resolved",
    routeType ? "PASS" : "BLOCKED",
    routeType ? routeType.replaceAll("_", " ") : "No authority route is recorded for this packet.",
  );
  const authority = input.authority;
  if (!authority) {
    add("authority_resolved", "Authority resolved", "BLOCKED", "No state authority is resolved for this packet.");
  } else if (routeType?.startsWith("florida_dos") && authority.state_code !== "FL") {
    add("authority_resolved", "Authority resolved", "BLOCKED", "The route requires the Florida Department of State.");
  } else {
    add("authority_resolved", "Authority resolved", "PASS", authority.authority_name);
  }
  const authorityEvaluation = authority ? evaluateStateAuthority(authority, now) : null;

  // ── Official form (registry only; never generated or rewritten) ──
  const authorityAssets = (input.assets ?? []).filter(
    (asset) => asset.asset_type === "official_form" && (!authority?.id || asset.authority_id === authority.id),
  );
  const form = authority?.id
    ? resolveOfficialAsset(input.assets, { authorityId: authority.id, assetType: "official_form" })
    : null;
  const isFlorida = authority?.state_code === "FL";
  const registeredHash = form?.asset?.repository_path ? REGISTERED_REPOSITORY_ASSET_HASHES[form.asset.repository_path] : undefined;
  if (!authority || authorityAssets.length === 0) {
    add("official_form_current", "Official form current", "BLOCKED", "No official form is registered for this authority.");
  } else if (form?.asset && registeredHash && form.asset.sha256 !== registeredHash) {
    add("official_form_current", "Official form current", "BLOCKED", "Official form hash does not match the registered repository asset.");
  } else if (!form || form.status === "MISSING") {
    add("official_form_current", "Official form current", "REVIEW_REQUIRED", "No active, official-source-backed, hashed form is available (superseded or under review).");
  } else if (form.status === "AMBIGUOUS") {
    add("official_form_current", "Official form current", "REVIEW_REQUIRED", form.reasons.join(" "));
  } else if (form.status === "OPERATOR_VERIFICATION_REQUIRED") {
    add("official_form_current", "Official form current", "REVIEW_REQUIRED", isFlorida ? FLORIDA_FORM_VERIFICATION_REASON : form.reasons.join(" "));
  } else {
    add("official_form_current", "Official form current", "PASS", `${form.asset.title} (${form.asset.source_version ?? "version not recorded"})`);
  }

  // ── Documents (canonical Matter document records only) ──
  const executionRequired = truth.notarization_requirement !== "not_required";
  const executed = executionCompleted(input.matterState, input.ronSessionStatus);
  const readiness = evaluateExecutionDocumentReadiness(input.files);
  const documents: PacketDocument[] = readiness.candidates.map((row) => {
    const file = row as PacketFileRow;
    return {
      document_id: file.id,
      filename: file.name ?? file.filename ?? file.id,
      document_type: input.documentType ?? null,
      preflight_status: file.structural_status ?? "NOT_RUN",
      execution_status: !executionRequired ? "NOT_REQUIRED" : executed ? "EXECUTED" : "PENDING_EXECUTION",
      sha256: file.sha256 ?? null,
      reference: file.storage_path ?? null,
      packet_role: packetRole(file),
    };
  });
  const sourceDocuments = documents.filter((doc) => doc.packet_role === "source_document");
  add(
    "source_documents_present",
    "Source documents present",
    sourceDocuments.length ? "PASS" : "BLOCKED",
    sourceDocuments.length ? `${sourceDocuments.length} source document(s) on file.` : "No source document is on file.",
  );
  const preflightStatuses = documents.map((doc) => doc.preflight_status);
  const preflightResult: PacketCheckResult = documents.length === 0
    ? "BLOCKED"
    : preflightStatuses.includes("BLOCKED")
      ? "BLOCKED"
      : preflightStatuses.every((status) => status === "READY")
        ? "PASS"
        : "REVIEW_REQUIRED";
  add(
    "document_preflight_ready",
    "Document structural preflight READY",
    preflightResult,
    preflightResult === "PASS" ? "All packet documents passed structural preflight." : readiness.unresolved.map((file) => `${file.label}: ${file.status}`).join("; ") || "No document to preflight.",
  );

  // ── Execution ──
  if (!executionRequired) {
    add("execution_complete", "Execution complete where required", "NOT_APPLICABLE", "Execution is not required for this document.");
  } else {
    add(
      "execution_complete",
      "Execution complete where required",
      executed ? "PASS" : "BLOCKED",
      executed ? "Execution completion is recorded." : "Required execution is not complete.",
    );
  }
  const isRon = truth.execution_method === "ron";
  if (!isRon || !executionRequired) {
    add("ron_execution_evidence", "RON execution evidence complete", "NOT_APPLICABLE", "Not a remote online execution.");
  } else {
    const ronComplete = Boolean(input.ronSessionStatus && RON_EXECUTION_COMPLETE.has(input.ronSessionStatus));
    add(
      "ron_execution_evidence",
      "RON execution evidence complete",
      ronComplete ? "PASS" : "BLOCKED",
      ronComplete ? `Provider session: ${input.ronSessionStatus}.` : "No completed RON provider session is recorded.",
    );
  }

  // ── Paper-out (never silently assumed not applicable) ──
  const paperOut = readPaperOutChecklist(truth);
  let paperOutApplicability: AuthorityPacketProjection["paperOutEvidence"]["applicability"];
  let paperOutBasis: string;
  if (isRon) {
    paperOutApplicability = "REQUIRED";
    paperOutBasis = "Electronic (RON) execution requires paper-out control.";
    add(
      "paper_out_satisfied",
      "Paper-out requirement satisfied",
      paperOut.status === "APPROVED" ? "PASS" : paperOut.status === "NOT_GENERATED" ? "BLOCKED" : "REVIEW_REQUIRED",
      paperOut.status === "APPROVED" ? "Paper-out checklist approved by operator." : `Paper-out checklist: ${paperOut.status.replaceAll("_", " ").toLowerCase()}.`,
    );
  } else if (PAPER_OUT_NOT_APPLICABLE_BY_RULE.has(String(truth.execution_method))) {
    paperOutApplicability = "NOT_APPLICABLE";
    paperOutBasis = "Wet-ink execution creates no electronic record (governed rule).";
    add("paper_out_satisfied", "Paper-out requirement satisfied", "NOT_APPLICABLE", paperOutBasis);
  } else if (recorded?.paper_out_not_applicable_at) {
    paperOutApplicability = "NOT_APPLICABLE";
    paperOutBasis = "Operator recorded paper-out as not applicable, with evidence.";
    add("paper_out_satisfied", "Paper-out requirement satisfied", "NOT_APPLICABLE", paperOutBasis);
  } else {
    paperOutApplicability = "UNRESOLVED";
    paperOutBasis = "Paper-out applicability has not been resolved.";
    add("paper_out_satisfied", "Paper-out requirement satisfied", "REVIEW_REQUIRED", paperOutBasis);
  }

  // ── Authentication route consistency (Hague status never proves acceptance) ──
  const destination = str(input.destinationCountry);
  const hague = destination ? getHagueCountryProfile(destination)?.hagueStatus ?? "unknown" : "unknown";
  if (routeType?.startsWith("florida_dos") && input.issuingLane === "federal") {
    add(
      "authentication_route_consistent",
      "Authentication route consistent",
      "BLOCKED",
      "Federal document: a state apostille route is not permitted (U.S. Department of State authentication).",
    );
  } else if (input.issuingLane === "unresolved") {
    add("authentication_route_consistent", "Authentication route consistent", "REVIEW_REQUIRED", "Issuing authority lane (state / federal) is unresolved.");
  } else if (!routeType || !destination) {
    add("authentication_route_consistent", "Authentication route consistent", "REVIEW_REQUIRED", "Route or destination is unresolved.");
  } else if (
    (routeType === "florida_dos_apostille" && hague === "hague_contracting_party") ||
    (routeType === "florida_dos_notarial_certificate" && hague === "non_hague")
  ) {
    add("authentication_route_consistent", "Authentication route consistent", "PASS", `Destination Hague status: ${hague.replaceAll("_", " ")}.`);
  } else {
    add(
      "authentication_route_consistent",
      "Authentication route consistent",
      "REVIEW_REQUIRED",
      `Route ${routeType.replaceAll("_", " ")} requires operator review for destination Hague status: ${hague.replaceAll("_", " ")}.`,
    );
  }

  // ── Government fee (pass-through; from VERIFIED provenance only) ──
  const fee = authority ? authorityStateFee(authority, now) : null;
  const feeSourceStatus: AuthorityPacketProjection["authorityFeeSourceStatus"] = !authority
    ? "MISSING"
    : authorityEvaluation?.status === "VERIFIED"
      ? "VERIFIED"
      : authorityEvaluation?.status === "STALE"
        ? "STALE"
        : "UNVERIFIED";
  add(
    "government_fee_known",
    "Government fee known",
    fee === null ? "REVIEW_REQUIRED" : "PASS",
    fee === null ? "Government fee has no current verified source." : `Pass-through government fee: $${fee.toFixed(2)}.`,
  );
  add(
    "government_fee_source_current",
    "Government fee source current",
    feeSourceStatus === "VERIFIED" ? "PASS" : "REVIEW_REQUIRED",
    feeSourceStatus === "VERIFIED"
      ? "Authority provenance verified within its review window."
      : feeSourceStatus === "STALE"
        ? "Authority fee source is stale."
        : (authorityEvaluation?.reasons.join(" ") || "Authority provenance is not verified."),
  );
  const method = recorded?.government_fee_payment_method ?? "UNKNOWN";
  const methodResult: PacketCheckResult =
    method === "READY" || (method === "NOT_REQUIRED" && fee === 0) ? "PASS" : "REVIEW_REQUIRED";
  add(
    "government_fee_payment_method_known",
    "Government fee payment method known",
    methodResult,
    method === "READY"
      ? "Fee payment instrument recorded as ready."
      : method === "NOT_REQUIRED"
        ? fee === 0 ? "No government fee payment is required." : "A fee payment instrument is marked not required, but the fee is not zero or unknown."
        : method === "REQUIRED"
          ? "A fee payment instrument is required and not yet ready."
          : "Fee payment instrument is not recorded.",
  );

  // ── Destination / count / shipments ──
  add(
    "destination_confirmed",
    "Destination country confirmed",
    destination ? "PASS" : "BLOCKED",
    destination ? destination : "Destination country is not recorded on the Matter.",
  );
  const count = recorded?.document_count ?? null;
  add(
    "document_count_confirmed",
    "Document count confirmed",
    count === null ? "REVIEW_REQUIRED" : count === sourceDocuments.length ? "PASS" : "BLOCKED",
    count === null
      ? "Document count is not recorded."
      : count === sourceDocuments.length
        ? `${count} document(s).`
        : `Recorded count ${count} does not match ${sourceDocuments.length} source document(s) on file.`,
  );
  const mode = recorded?.return_shipment_mode ?? "unknown";
  add(
    "outbound_shipment_resolved",
    "Outbound shipment requirement resolved",
    mode === "unknown" ? "REVIEW_REQUIRED" : "PASS",
    mode === "unknown" ? "Shipment arrangement is unresolved." : "Outbound shipment to the authority is required.",
  );
  add(
    "return_shipment_resolved",
    "Return shipment requirement resolved",
    mode === "unknown" ? "REVIEW_REQUIRED" : "PASS",
    mode === "unknown" ? "Return shipment requirement is unresolved." : mode.replaceAll("_", " "),
  );

  // ── Exceptions ──
  const exceptions = activeMatterExceptions(input.matterState, input.custodyEvents);
  add(
    "blocking_exception_absent",
    "Blocking Matter exception absent",
    exceptions.length ? "BLOCKED" : "PASS",
    exceptions.length ? exceptions.join(" ") : "No blocking exception.",
  );

  // ── Status ──
  const blockers = checks.filter((check) => check.result === "BLOCKED").map((check) => `${check.label}: ${check.detail}`);
  const reviewReasons = checks.filter((check) => check.result === "REVIEW_REQUIRED").map((check) => `${check.label}: ${check.detail}`);
  const qa = recorded?.qa ?? null;
  const qaDone = qaComplete(qa);
  const dispatchReadyAt = time(recorded?.dispatch_ready_at);
  const dispatched =
    dispatchReadyAt !== null &&
    (input.custodyEvents ?? []).some(
      (row) => row.event === AUTHORITY_DISPATCH_CUSTODY_EVENT && (time(row.created_at) ?? -1) >= dispatchReadyAt,
    );

  let status: AuthorityPacketStatus;
  if (dispatched) status = "DISPATCHED";
  else if (blockers.length) status = "NOT_READY";
  else if (reviewReasons.length) status = "REVIEW_REQUIRED";
  else if (!recorded?.assembled_at) status = "READY_TO_ASSEMBLE";
  else if (!qaDone || dispatchReadyAt === null) status = "ASSEMBLED";
  else status = "READY_FOR_DISPATCH";

  if (status === "ASSEMBLED") {
    if (!qaDone) warnings.push("Operator QA has not been completed.");
    else warnings.push("Dispatch has not been approved.");
  }
  if (status === "READY_FOR_DISPATCH") {
    warnings.push("Awaiting canonical dispatch evidence (custody submission event).");
  }

  const missingItems = [...blockers, ...reviewReasons, ...(status === "ASSEMBLED" ? warnings : [])];
  const qaValid = qaDone && (status === "ASSEMBLED" || status === "READY_FOR_DISPATCH" || status === "DISPATCHED");
  const approvedValid = status === "READY_FOR_DISPATCH" || status === "DISPATCHED";

  return {
    matterId: input.matterId,
    authorityId: authority?.id ?? recorded?.authority_id ?? null,
    routeType,
    destinationCountry: destination,
    documentCount: count,
    officialFormAsset: form?.asset
      ? {
          id: form.asset.id,
          title: form.asset.title,
          repositoryPath: form.asset.repository_path ?? null,
          officialSourceUrl: form.asset.official_source_url ?? null,
          sourceVersion: form.asset.source_version ?? null,
          sha256: form.asset.sha256 ?? null,
          resolution: form.status,
        }
      : null,
    sourceDocuments: documents,
    paperOutEvidence: {
      applicability: paperOutApplicability,
      basis: paperOutBasis,
      status: paperOut.status,
      operatorApprovedAt: paperOut.operatorApprovedAt,
    },
    authorityFee: fee,
    authorityFeeCurrency: "USD",
    authorityFeeSourceStatus: feeSourceStatus,
    authorityFeeTreatment: "PASS_THROUGH",
    countsAsMilanoRevenue: false,
    paymentMethodStatus: method,
    outboundShippingRequired: mode === "unknown" ? null : true,
    returnShippingRequired: mode === "unknown" ? null : mode === "outbound_prepaid_return",
    returnShipmentMode: mode,
    operatorQa: {
      ...(qa ?? {
        document_count_confirmed: false,
        official_form_confirmed: false,
        authority_confirmed: false,
        fees_confirmed: false,
        payment_instrument_confirmed: false,
        return_shipping_confirmed: false,
        destination_confirmed: false,
        paper_out_confirmed: false,
        operator_note: null,
        approved_by: null,
        approved_at: null,
      }),
      complete: qaValid,
    },
    packetStatus: status,
    checks,
    missingItems,
    reviewReasons,
    blockers,
    warnings,
    createdAt: recorded?.evaluated_at ?? null,
    approvedAt: approvedValid ? recorded?.dispatch_ready_at ?? null : null,
    approvedBy: approvedValid ? recorded?.dispatch_approved_by ?? null : null,
  };
}

export interface PacketEvaluationFacts {
  authority_id?: string;
  route_type?: PacketRouteType;
  document_count?: number;
  government_fee_payment_method?: PacketFeePaymentMethodStatus;
  return_shipment_mode?: ReturnShipmentMode;
  paper_out_not_applicable?: boolean;
}

const LIFECYCLE_KEYS = ["assembled_at", "assembled_by", "qa", "dispatch_ready_at", "dispatch_approved_by"];

/**
 * In-memory mirror of the record_matter_authority_packet "evaluate" merge,
 * used only to project the post-evaluation status for evidence. The database
 * function remains the single writer.
 */
export function simulatePacketEvaluation(
  executionTruth: unknown,
  facts: PacketEvaluationFacts,
  occurredAt: string,
  actorId: string,
): Record<string, unknown> {
  const truth = { ...asObject(executionTruth) };
  const prior = asObject(truth.authority_packet);
  const packet: Record<string, unknown> = { ...prior };
  const patch: Record<string, unknown> = {};
  for (const key of ["authority_id", "route_type", "document_count", "government_fee_payment_method", "return_shipment_mode"] as const) {
    if (facts[key] !== undefined) patch[key] = facts[key];
  }
  let changed = Object.entries(patch).some(([key, value]) => prior[key] !== value);
  if (facts.paper_out_not_applicable !== undefined) {
    const had = typeof prior.paper_out_not_applicable_at === "string";
    if (facts.paper_out_not_applicable && !had) {
      patch.paper_out_not_applicable_at = occurredAt;
      patch.paper_out_not_applicable_by = actorId;
    }
    if (!facts.paper_out_not_applicable) {
      delete packet.paper_out_not_applicable_at;
      delete packet.paper_out_not_applicable_by;
    }
    if (had !== facts.paper_out_not_applicable) changed = true;
  }
  if (changed) for (const key of LIFECYCLE_KEYS) delete packet[key];
  truth.authority_packet = { ...packet, ...patch, evaluated_at: occurredAt, evaluated_by: actorId };
  return truth;
}
