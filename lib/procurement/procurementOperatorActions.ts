/**
 * procurementOperatorActions — procurement action definitions expressed in the
 * shared operator-action shape. This does NOT create a parallel task system; it
 * produces deduplicated action items the existing operator surfaces can consume.
 */

export type ProcurementActionType =
  | "review_opportunity"
  | "make_bid_decision"
  | "complete_vendor_registration"
  | "submit_questions"
  | "attend_prebid"
  | "complete_compliance_item"
  | "upload_attachment"
  | "request_reference_consent"
  | "obtain_insurance_evidence"
  | "prepare_pricing"
  | "draft_proposal"
  | "review_proposal"
  | "sign_submission"
  | "submit_response"
  | "confirm_submission"
  | "respond_clarification"
  | "prepare_interview"
  | "record_award"
  | "request_debrief"
  | "review_renewal";

export type ActionPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export interface ProcurementOperatorAction {
  id: string;
  actionType: ProcurementActionType;
  title: string;
  description: string;
  priority: ActionPriority;
  status: "open" | "in_progress" | "blocked" | "done";
  owner: string | null;
  dueAt: string | null;
  blocker: string | null;
  sourceSubmissionId: string | null;
  route: string;
}

/** Deduplicate equivalent actions by (actionType + sourceSubmissionId). */
export function deduplicateActions(
  actions: ProcurementOperatorAction[],
): ProcurementOperatorAction[] {
  const seen = new Set<string>();
  const out: ProcurementOperatorAction[] = [];
  for (const a of actions) {
    const key = `${a.actionType}::${a.sourceSubmissionId ?? "none"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}
