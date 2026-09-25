// Governed authority packet composer. Builds an operator-ready packet MANIFEST
// around official authority assets and canonical execution evidence.
//
// This is NOT a legal-document drafting engine, NOT a government-form
// generator and NOT a legal-advice engine. It never modifies or signs an
// official form, never invents a fee or submission address, never declares
// legal sufficiency and never asserts authority acceptance. The government
// fee is a pass-through and is never Milano revenue.

import { MATTER_STATES } from "@/data/matter-state-machine";
import { evaluateExecutionDocumentReadiness, type PreflightFileRow } from "./documentReadiness";
import { readPaperOutChecklist } from "./paperOut";
import { documentPreflightPosture } from "./ronProviderCapabilities";
import {
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

export type PacketCheckKey =
  | "official_form_current"
  | "source_document_present"
  | "document_preflight_passed"
  | "execution_complete"
  | "paper_out_complete"
  | "government_fee_known"
  | "government_fee_method_ready"
  | "destination_confirmed"
  | "document_count_confirmed"
  | "return_shipment_resolved"
  | "operator_qa_complete";

export type PacketCheckResult = "PASS" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_APPLICABLE";

export interface PacketCheck {
  key: PacketCheckKey;
  label: string;
  result: PacketCheckResult;
  detail: string;
}

/** Operator-recorded packet facts (execution_truth.authority_packet). */
export interface RecordedAuthorityPacket {
  authority_id?: string | null;
  route_type?: string | null;
  document_count?: number | null;
  destination_confirmed?: boolean | null;
  government_fee_method_status?: "ready" | "not_ready" | "unknown" | null;
  return_shipping?: "required" | "not_required" | "unknown" | null;
  built_at?: string | null;
  assembled_at?: string | null;
  assembled_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  dispatched_at?: string | null;
}

export interface AuthorityPacketInput {
  matterId: string;
  matterState?: string | null;
  destinationCountry?: string | null;
  executionTruth: unknown;
  files: readonly PreflightFileRow[] | null | undefined;
  ronSessionStatus?: string | null;
  authority: StateAuthorityRecord | null;
  assets: readonly AuthoritySourceAsset[] | null | undefined;
  recorded?: RecordedAuthorityPacket | null;
}

export interface AuthorityPacketManifest {
  matter_id: string;
  authority_id: string | null;
  route_type: string | null;
  official_form_asset: {
    id: string;
    title: string;
    repository_path: string | null;
    official_source_url: string | null;
    source_version: string | null;
    sha256: string | null;
    resolution: string;
  } | null;
  source_documents: { id: string; label: string; status: string }[];
  paper_out_evidence: { required: boolean; status: string; operator_approved_at: string | null };
  authority_fee: {
    amount: number | null;
    currency: "USD";
    treatment: "PASS_THROUGH";
    milano_revenue: false;
    source: "state_authority_record";
  };
  payment_method_status: "ready" | "not_ready" | "unknown";
  destination_country: string | null;
  document_count: number | null;
  outbound_shipping_required: boolean;
  return_shipping_required: boolean | null;
  operator_qa: { complete: boolean; approved_at: string | null; approved_by: string | null };
  packet_status: AuthorityPacketStatus;
  missing_items: string[];
  checks: PacketCheck[];
  created_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

const RON_EXECUTION_COMPLETE = new Set(["RON_COMPLETED", "SIGNED_DOCS_RETRIEVED", "READY_FOR_APOSTILLE"]);
const NON_PROGRESS_STATES = new Set(["apostille_rejected", "dormant", "lost", "cancelled"]);
const EXECUTION_COMPLETE_INDEX = MATTER_STATES.indexOf("ron_completed");

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** Execution completion from canonical evidence only (RON session or Matter state). */
export function executionCompleted(matterState: string | null | undefined, ronSessionStatus: string | null | undefined) {
  if (ronSessionStatus && RON_EXECUTION_COMPLETE.has(ronSessionStatus)) return true;
  if (!matterState || NON_PROGRESS_STATES.has(matterState)) return false;
  const index = (MATTER_STATES as readonly string[]).indexOf(matterState);
  return index >= EXECUTION_COMPLETE_INDEX;
}

/** Reads operator-recorded packet facts from execution truth (whitelisted). */
export function readRecordedAuthorityPacket(executionTruth: unknown): RecordedAuthorityPacket | null {
  const raw = asObject(executionTruth).authority_packet;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const packet = raw as Record<string, unknown>;
  const str = (key: string) => (typeof packet[key] === "string" ? (packet[key] as string) : null);
  const count = Number(packet.document_count);
  const fee = str("government_fee_method_status");
  const ret = str("return_shipping");
  return {
    authority_id: str("authority_id"),
    route_type: str("route_type"),
    document_count: Number.isInteger(count) && count > 0 ? count : null,
    destination_confirmed: packet.destination_confirmed === true,
    government_fee_method_status: fee === "ready" || fee === "not_ready" ? fee : "unknown",
    return_shipping: ret === "required" || ret === "not_required" ? ret : "unknown",
    built_at: str("built_at"),
    assembled_at: str("assembled_at"),
    assembled_by: str("assembled_by"),
    approved_at: str("approved_at"),
    approved_by: str("approved_by"),
    dispatched_at: str("dispatched_at"),
  };
}

export function composeAuthorityPacket(input: AuthorityPacketInput, now: Date = new Date()): AuthorityPacketManifest {
  const truth = asObject(input.executionTruth);
  const recorded = input.recorded ?? readRecordedAuthorityPacket(truth) ?? {};
  const checks: PacketCheck[] = [];
  const add = (key: PacketCheckKey, label: string, result: PacketCheckResult, detail: string) =>
    checks.push({ key, label, result, detail });

  // ── Official form (registry only; never generated) ──
  const authorityEvaluation = input.authority ? evaluateStateAuthority(input.authority, now) : null;
  const form = input.authority?.id
    ? resolveOfficialAsset(input.assets, { authorityId: input.authority.id, assetType: "official_form" })
    : ({ status: "MISSING", asset: null, reasons: ["No state authority is selected for this packet."] } as const);
  if (form.status === "MISSING" || form.status === "AMBIGUOUS") {
    add("official_form_current", "Official form current", "BLOCKED", form.reasons.join(" "));
  } else if (form.status === "OPERATOR_VERIFICATION_REQUIRED" || authorityEvaluation?.status !== "VERIFIED") {
    add(
      "official_form_current",
      "Official form current",
      "REVIEW_REQUIRED",
      [...form.reasons, ...(authorityEvaluation?.reasons ?? [])].join(" ") ||
        "Authority provenance is not verified.",
    );
  } else {
    add("official_form_current", "Official form current", "PASS", `${form.asset.title} (${form.asset.source_version ?? "version not recorded"})`);
  }

  // ── Source documents + preflight ──
  const readiness = evaluateExecutionDocumentReadiness(input.files);
  if (readiness.candidates.length === 0) {
    add("source_document_present", "Eligible source document present", "BLOCKED", "No eligible source document is on file.");
  } else {
    add("source_document_present", "Eligible source document present", "PASS", `${readiness.candidates.length} document(s) on file.`);
  }
  const preflight = documentPreflightPosture(input.files);
  add(
    "document_preflight_passed",
    "Document preflight passed",
    preflight === "READY" ? "PASS" : preflight === "BLOCKED" ? "BLOCKED" : "REVIEW_REQUIRED",
    preflight === "READY" ? "Structural preflight passed." : `Document preflight: ${preflight.replaceAll("_", " ").toLowerCase()}.`,
  );

  // ── Execution ──
  const executionRequired = truth.notarization_requirement !== "not_required";
  if (!executionRequired) {
    add("execution_complete", "Required execution complete", "NOT_APPLICABLE", "Execution is not required for this document.");
  } else if (executionCompleted(input.matterState, input.ronSessionStatus)) {
    add("execution_complete", "Required execution complete", "PASS", "Execution completion is recorded.");
  } else {
    add("execution_complete", "Required execution complete", "BLOCKED", "Required execution is not complete.");
  }

  // ── Paper-out (electronic execution only) ──
  const paperOutRequired = truth.execution_method === "ron";
  const paperOut = readPaperOutChecklist(truth);
  if (!paperOutRequired) {
    add("paper_out_complete", "Paper-out evidence complete", "NOT_APPLICABLE", "Not an electronic execution.");
  } else if (paperOut.status === "APPROVED") {
    add("paper_out_complete", "Paper-out evidence complete", "PASS", "Paper-out checklist approved by operator.");
  } else {
    add("paper_out_complete", "Paper-out evidence complete", "REVIEW_REQUIRED", `Paper-out checklist: ${paperOut.status.replaceAll("_", " ").toLowerCase()}.`);
  }

  // ── Government fee (pass-through; never invented) ──
  const fee = input.authority ? authorityStateFee(input.authority, now) : null;
  add(
    "government_fee_known",
    "Government fee known",
    fee === null ? "REVIEW_REQUIRED" : "PASS",
    fee === null ? "Government fee has no current verified source." : `Pass-through government fee: $${fee.toFixed(2)}.`,
  );
  const feeMethod = recorded.government_fee_method_status ?? "unknown";
  add(
    "government_fee_method_ready",
    "Government fee payment method ready",
    feeMethod === "ready" ? "PASS" : "REVIEW_REQUIRED",
    feeMethod === "ready" ? "Fee payment instrument recorded as ready." : "Fee payment instrument is not confirmed.",
  );

  // ── Destination / count / return ──
  const destination = input.destinationCountry?.trim() || null;
  add(
    "destination_confirmed",
    "Destination confirmed",
    destination && recorded.destination_confirmed ? "PASS" : "REVIEW_REQUIRED",
    destination ? (recorded.destination_confirmed ? `Destination: ${destination}.` : "Destination has not been confirmed by an operator.") : "Destination country is not recorded.",
  );
  const count = recorded.document_count ?? null;
  add(
    "document_count_confirmed",
    "Document count confirmed",
    count ? "PASS" : "REVIEW_REQUIRED",
    count ? `${count} document(s) in packet.` : "Document count is not confirmed.",
  );
  const returnShipping = recorded.return_shipping ?? "unknown";
  add(
    "return_shipment_resolved",
    "Return shipment requirement resolved",
    returnShipping === "unknown" ? "REVIEW_REQUIRED" : "PASS",
    returnShipping === "unknown" ? "Return shipment requirement is unresolved." : `Return shipment ${returnShipping.replace("_", " ")}.`,
  );

  // ── Status ──
  const preAssembly = checks.filter((check) => check.result !== "NOT_APPLICABLE");
  const blocked = preAssembly.some((check) => check.result === "BLOCKED");
  const review = preAssembly.some((check) => check.result === "REVIEW_REQUIRED");
  const qaComplete = Boolean(recorded.approved_at && recorded.approved_by);

  let status: AuthorityPacketStatus;
  if (blocked) status = "NOT_READY";
  else if (review) status = "REVIEW_REQUIRED";
  else if (!recorded.assembled_at) status = "READY_TO_ASSEMBLE";
  else if (!qaComplete) status = "ASSEMBLED";
  else if (!recorded.dispatched_at) status = "READY_FOR_DISPATCH";
  else status = "DISPATCHED";

  add(
    "operator_qa_complete",
    "Operator QA complete",
    qaComplete && !blocked && !review ? "PASS" : "REVIEW_REQUIRED",
    qaComplete ? "Operator final QA recorded." : "Operator final QA has not been recorded.",
  );

  const missing = checks
    .filter((check) => check.result === "BLOCKED" || check.result === "REVIEW_REQUIRED")
    .filter((check) => check.key !== "operator_qa_complete" || status === "ASSEMBLED")
    .map((check) => `${check.label}: ${check.detail}`);

  const qaValid = qaComplete && (status === "READY_FOR_DISPATCH" || status === "DISPATCHED");

  return {
    matter_id: input.matterId,
    authority_id: input.authority?.id ?? recorded.authority_id ?? null,
    route_type: recorded.route_type ?? null,
    official_form_asset: form.asset
      ? {
          id: form.asset.id,
          title: form.asset.title,
          repository_path: form.asset.repository_path ?? null,
          official_source_url: form.asset.official_source_url ?? null,
          source_version: form.asset.source_version ?? null,
          sha256: form.asset.sha256 ?? null,
          resolution: form.status,
        }
      : null,
    source_documents: readiness.candidates.map((file) => ({
      id: file.id,
      label: file.name ?? file.filename ?? file.id,
      status: file.structural_status ?? "NOT_RUN",
    })),
    paper_out_evidence: {
      required: paperOutRequired,
      status: paperOut.status,
      operator_approved_at: paperOut.operatorApprovedAt,
    },
    authority_fee: {
      amount: fee,
      currency: "USD",
      treatment: "PASS_THROUGH",
      milano_revenue: false,
      source: "state_authority_record",
    },
    payment_method_status: feeMethod,
    destination_country: destination,
    document_count: count,
    outbound_shipping_required: true,
    return_shipping_required: returnShipping === "unknown" ? null : returnShipping === "required",
    operator_qa: {
      complete: qaValid,
      approved_at: qaValid ? recorded.approved_at ?? null : null,
      approved_by: qaValid ? recorded.approved_by ?? null : null,
    },
    packet_status: status,
    missing_items: missing,
    checks,
    created_at: recorded.built_at ?? null,
    approved_at: qaValid ? recorded.approved_at ?? null : null,
    approved_by: qaValid ? recorded.approved_by ?? null : null,
  };
}
