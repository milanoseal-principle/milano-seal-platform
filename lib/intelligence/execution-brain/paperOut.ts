// Florida paper-out control: a projection over the operator-recorded checklist
// in canonical execution truth (execution_truth.paper_out). Items are only
// ever confirmed by an operator through record_matter_paper_out; nothing here
// infers completion or asserts Florida DOS acceptance.

import { FLORIDA_SUBMISSION_NOTICE } from "./stateAuthorityProvenance";

export const PAPER_OUT_ITEMS = [
  { key: "original_electronic_record_retained", label: "Original electronic record retained", optional: false },
  { key: "tamper_evidence_reviewed", label: "Tamper evidence reviewed", optional: false },
  { key: "executed_electronic_record_confirmed", label: "Executed electronic record confirmed", optional: false },
  { key: "paper_conversion_procedure_confirmed", label: "Paper conversion procedure confirmed", optional: false },
  { key: "statutory_certificate_completed", label: "Statutory certificate completed where applicable", optional: true },
  { key: "destination_confirmed", label: "Destination confirmed", optional: false },
  { key: "receiving_authority_reviewed", label: "Receiving authority reviewed", optional: false },
  { key: "florida_dos_requirements_reviewed", label: "Current Florida DOS requirements reviewed", optional: false },
] as const;

export type PaperOutItemKey = (typeof PAPER_OUT_ITEMS)[number]["key"];
export type PaperOutItemStatus = "confirmed" | "not_applicable" | "pending";
export type PaperOutStatus = "NOT_GENERATED" | "IN_PROGRESS" | "READY_FOR_APPROVAL" | "APPROVED";

export interface PaperOutChecklist {
  status: PaperOutStatus;
  generatedAt: string | null;
  items: { key: PaperOutItemKey; label: string; optional: boolean; status: PaperOutItemStatus; recordedAt: string | null }[];
  pending: PaperOutItemKey[];
  operatorApprovedAt: string | null;
  notice: string;
}

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export function readPaperOutChecklist(executionTruth: unknown): PaperOutChecklist {
  const truth = asObject(executionTruth);
  const paper = truth.paper_out === undefined || truth.paper_out === null ? null : asObject(truth.paper_out);
  const recorded = asObject(paper?.items);

  const items = PAPER_OUT_ITEMS.map((item) => {
    const entry = asObject(recorded[item.key]);
    const raw = entry.status;
    const status: PaperOutItemStatus =
      raw === "confirmed" || (raw === "not_applicable" && item.optional) ? raw : "pending";
    return {
      key: item.key,
      label: item.label,
      optional: item.optional,
      status,
      recordedAt: status === "pending" || typeof entry.recorded_at !== "string" ? null : entry.recorded_at,
    };
  });
  const pending = items.filter((item) => item.status === "pending").map((item) => item.key);
  const generatedAt = paper && typeof paper.generated_at === "string" ? paper.generated_at : null;
  const operatorApprovedAt =
    paper && typeof paper.operator_approved_at === "string" && pending.length === 0 ? paper.operator_approved_at : null;

  const status: PaperOutStatus = !paper
    ? "NOT_GENERATED"
    : operatorApprovedAt
      ? "APPROVED"
      : pending.length === 0
        ? "READY_FOR_APPROVAL"
        : "IN_PROGRESS";

  return { status, generatedAt, items, pending, operatorApprovedAt, notice: FLORIDA_SUBMISSION_NOTICE };
}
