/**
 * maritimeOperatorActions — maritime action definitions in the shared operator-
 * action shape, with dedup. Not a parallel task system.
 */

export type MaritimeActionType =
  | "review_maritime_intake"
  | "verify_commercial_requester"
  | "verify_signer_authority"
  | "verify_shipment_reference"
  | "confirm_deadline"
  | "review_document_readiness"
  | "prepare_commercial_quote"
  | "verify_payment"
  | "schedule_maritime_execution"
  | "assign_port_area_partner"
  | "verify_apostille_path"
  | "verify_translation_path"
  | "confirm_courier_cutoff"
  | "prepare_courier_release"
  | "resolve_maritime_blocker"
  | "authorize_release"
  | "complete_account_follow_up"
  | "schedule_retainer_review"
  | "request_commercial_referral";

export interface MaritimeOperatorAction {
  id: string;
  actionType: MaritimeActionType;
  title: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  status: "open" | "in_progress" | "blocked" | "done";
  owner: string | null;
  dueAt: string | null;
  blocker: string | null;
  sourceMatterId: string | null;
  route: string;
}

/** Deduplicate equivalent actions by (actionType + matter). */
export function deduplicateMaritimeActions(
  actions: MaritimeOperatorAction[],
): MaritimeOperatorAction[] {
  const seen = new Set<string>();
  const out: MaritimeOperatorAction[] = [];
  for (const a of actions) {
    const key = `${a.actionType}::${a.sourceMatterId ?? "none"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}
