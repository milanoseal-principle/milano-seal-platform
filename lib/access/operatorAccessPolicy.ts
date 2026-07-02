export type AccessDecision = "allowed" | "blocked" | "founder_admin_only";

export const VA_ALLOWED_ACTIONS = [
  "intake_completeness_review",
  "document_checklist_prep",
  "client_follow_up_draft",
  "scheduling_coordination_draft",
  "shipping_label_prep_draft_operator_approved",
  "review_queue_organization",
  "referral_list_organization",
  "seo_content_staging",
] as const;

export const VA_BLOCKED_ACTIONS = [
  "confirm_payment",
  "mark_paid",
  "comp_clear",
  "approve_discount",
  "schedule_execution_without_payment_clearance",
  "approve_bluenotary_completion",
  "approve_release",
  "release_packet",
  "override_custody",
  "view_unrelated_client_sensitive_data",
  "wise_reconciliation",
  "edit_payment_webhook",
  "edit_supabase_policies",
] as const;

export const FOUNDER_ADMIN_ONLY_ACTIONS = [
  "approve_release",
  "reconcile_wise",
  "approve_comp_clear",
  "approve_alliance_dispatch",
  "manage_environment_variables",
  "approve_high_risk_compliance_route",
  "manage_bluenotary_webhook_setup",
] as const;

export const OPERATOR_POLICY_STATUS = {
  enforcement: "partial",
  note: "Policy constants document access boundaries without rewriting auth or role enforcement.",
} as const;

export function getVaActionDecision(action: string): AccessDecision {
  if ((VA_ALLOWED_ACTIONS as readonly string[]).includes(action)) return "allowed";
  if ((VA_BLOCKED_ACTIONS as readonly string[]).includes(action)) return "blocked";
  if ((FOUNDER_ADMIN_ONLY_ACTIONS as readonly string[]).includes(action)) return "founder_admin_only";
  return "blocked";
}

export function isFounderAdminOnly(action: string): boolean {
  return (FOUNDER_ADMIN_ONLY_ACTIONS as readonly string[]).includes(action);
}
