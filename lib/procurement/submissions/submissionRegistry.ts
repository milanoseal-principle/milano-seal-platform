/**
 * submissionRegistry — canonical registry of recorded government/institutional
 * submissions. Holds the real Pinellas ITQ record and enforces award safety:
 * a submission cannot be reported as awarded without documented award evidence.
 */

import {
  PINELLAS_ITQ_250786,
  type GovernmentSubmissionRecord,
} from "@/lib/government/submissions/pinellasItq250786";
import { canRecordAward } from "@/lib/procurement/procurementSafety";

export type SubmissionStatus =
  | "draft"
  | "internal_review"
  | "ready_to_submit"
  | "submitted"
  | "clarification"
  | "shortlisted"
  | "awarded"
  | "not_awarded"
  | "cancelled"
  | "archived";

export const SUBMISSION_REGISTRY: GovernmentSubmissionRecord[] = [
  PINELLAS_ITQ_250786,
];

export function listSubmissions(): GovernmentSubmissionRecord[] {
  return SUBMISSION_REGISTRY;
}

export function getSubmission(id: string): GovernmentSubmissionRecord | null {
  return SUBMISSION_REGISTRY.find((s) => s.id === id) ?? null;
}

/** Real (non-sample) submissions only — safe for KPI/reporting surfaces. */
export function listRealSubmissions(): GovernmentSubmissionRecord[] {
  return SUBMISSION_REGISTRY.filter((s) => !s.isSample);
}

/**
 * Safety gate: returns whether a submission may be marked awarded. Never allow
 * an award without documented, verified evidence.
 */
export function canMarkAwarded(id: string, awardEvidenceRef?: string | null): boolean {
  const s = getSubmission(id);
  if (!s) return false;
  return canRecordAward({ awardEvidenceRef: awardEvidenceRef ?? s.awardEvidenceRef, verified: true });
}
