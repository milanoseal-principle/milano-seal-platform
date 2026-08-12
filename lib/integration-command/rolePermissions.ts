/**
 * Role permission matrix for the four Milano Seal OS workspaces. This is the
 * authorization source of truth for the Task Orchestration layer — it does NOT
 * touch payment/scheduling/release/custody logic; it only decides which
 * capabilities a role may exercise. Denials are explicit and conservative.
 */

export type WorkspaceRole =
  | "founder"
  | "admin"
  | "operator"
  | "alliance_member"
  | "virtual_assistant";

/** Sensitive capabilities gated per role. */
export type Capability =
  | "view_matter_summary"
  | "assign_task"
  | "review_task_completion"
  | "confirm_payment"
  | "unlock_scheduling"
  | "authorize_release"
  | "mutate_custody"
  | "mark_ron_complete"
  | "purchase_courier_label"
  | "view_internal_margin"
  | "view_raw_provider_payload"
  | "view_unrelated_matter"
  | "view_commercial_intelligence"
  | "prepare_reminder"
  | "monitor_tracking"
  | "attach_permitted_evidence"
  | "coordinate_alliance"
  | "escalate_to_founder"
  | "approve_exception";

const ALLOW: Record<WorkspaceRole, Capability[]> = {
  founder: [
    "view_matter_summary", "assign_task", "review_task_completion", "approve_exception",
    "escalate_to_founder", "coordinate_alliance", "monitor_tracking", "prepare_reminder",
    // Founder may VIEW margins/intelligence; protected actions still route through existing gates.
    "view_internal_margin", "view_commercial_intelligence",
  ],
  admin: [
    "view_matter_summary", "assign_task", "review_task_completion", "approve_exception",
    "coordinate_alliance", "monitor_tracking", "prepare_reminder", "view_commercial_intelligence",
  ],
  operator: [
    "view_matter_summary", "assign_task", "review_task_completion",
    "prepare_reminder", "monitor_tracking", "attach_permitted_evidence", "coordinate_alliance",
    "escalate_to_founder",
  ],
  alliance_member: [
    "view_matter_summary", "attach_permitted_evidence", "monitor_tracking",
  ],
  virtual_assistant: [
    "view_matter_summary", "prepare_reminder", "monitor_tracking",
    "attach_permitted_evidence", "coordinate_alliance", "escalate_to_founder",
  ],
};

/** Capabilities NEVER granted to a role regardless of context (hard denials). */
const HARD_DENY: Record<WorkspaceRole, Capability[]> = {
  founder: [],
  admin: ["confirm_payment", "unlock_scheduling", "authorize_release", "mutate_custody"],
  operator: [],
  alliance_member: [
    "confirm_payment", "unlock_scheduling", "authorize_release", "mutate_custody",
    "mark_ron_complete", "purchase_courier_label", "view_internal_margin",
    "view_raw_provider_payload", "view_unrelated_matter", "view_commercial_intelligence",
    "assign_task",
  ],
  virtual_assistant: [
    "confirm_payment", "unlock_scheduling", "authorize_release", "mutate_custody",
    "mark_ron_complete", "purchase_courier_label", "view_internal_margin",
    "view_raw_provider_payload", "view_unrelated_matter", "view_commercial_intelligence",
    "approve_exception",
  ],
};

/** Authoritative check: may this role exercise this capability? */
export function can(role: WorkspaceRole, capability: Capability): boolean {
  if (HARD_DENY[role].includes(capability)) return false;
  return ALLOW[role].includes(capability);
}

/** All capabilities a role may exercise (for UI gating). */
export function capabilitiesFor(role: WorkspaceRole): Capability[] {
  return ALLOW[role].filter((c) => !HARD_DENY[role].includes(c));
}

/** Protected capabilities no non-founder/operator role may ever hold. */
export const PROTECTED_CAPABILITIES: Capability[] = [
  "confirm_payment", "unlock_scheduling", "authorize_release", "mutate_custody", "mark_ron_complete",
];
