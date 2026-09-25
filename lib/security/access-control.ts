// Identity & Access Controls
// Deterministic role guards — no DB calls, no AI.
// All permission checks are hard boundaries, not suggestions.

export type MilanRole =
  | "founder_admin"
  | "admin"
  | "admin_operator"
  | "ops_manager"
  | "finance"
  | "execution_coordinator"
  | "apostille_coordinator"
  | "finance_operator"
  | "client_support"
  | "virtual_assistant"
  | "va_manager"
  | "intake_assistant"
  | "scheduling_assistant"
  | "document_coordinator"
  | "translation_coordinator"
  | "courier_assistant"
  | "followup_coordinator"
  | "alliance_support_assistant"
  | "escalation_assistant"
  | "client"
  | "alliance"
  | "alliance_partner"
  | "alliance_member"
  | "professional"
  | "public";

const FOUNDER_ROLES = new Set<MilanRole>(["founder_admin"]);

const OPERATOR_ROLES = new Set<MilanRole>([
  "founder_admin", "admin", "admin_operator", "ops_manager",
  "finance", "execution_coordinator", "apostille_coordinator",
  "finance_operator", "client_support",
]);

const VA_ROLES = new Set<MilanRole>([
  "virtual_assistant", "va_manager", "intake_assistant",
  "scheduling_assistant", "document_coordinator", "translation_coordinator",
  "courier_assistant", "followup_coordinator", "alliance_support_assistant",
  "escalation_assistant",
]);

const CLIENT_ROLES = new Set<MilanRole>([
  "client", "alliance", "alliance_partner", "alliance_member",
]);

// ── Founder-only actions ─────────────────────────────────────────────────────
const FOUNDER_ONLY_ACTIONS = new Set([
  "confirm_payment_manual",
  "override_release_block",
  "release_final_documents",
  "create_legacy_client_credit",
  "change_pricing",
  "apply_discount",
  "close_matter",
  "view_operator_notes",
  "view_internal_pricing",
  "founder_pricing_override",
]);

// ── VA forbidden actions ─────────────────────────────────────────────────────
const VA_FORBIDDEN_ACTIONS = new Set([
  "confirm_payment",
  "confirm_payment_manual",
  "release_final_documents",
  "close_matter",
  "view_operator_notes",
  "view_internal_pricing",
  "view_margin",
  "edit_compliance_pathway",
  "override_safety_gate",
  "override_release_block",
  "change_pricing",
  "apply_discount",
  "create_legacy_client_credit",
]);

// ── Client forbidden fields (projection blocklist) ───────────────────────────
export const CLIENT_FORBIDDEN_FIELDS = new Set([
  "internal_notes",
  "operator_notes",
  "operator_note",
  "discount_reason",
  "raw_webhook",
  "raw_webhook_payload",
  "raw_payload",
  "raw_event",
  "margin",
  "net_margin",
  "base_cost",
  "shipping_cost",
  "shipping_spread",
  "label_url",
  "actual_shippo_cost",
  "service_role_key",
  "operator_summary",
  "internal_reason",
  "source_uncertainty",
  "revenue_score",
  "signing_url",
  "full_signing_url",
  "bn_signing_url",
  "wise_payload",
  "storage_path",
  "file_path",
]);

// ── Role helpers ─────────────────────────────────────────────────────────────
export function isFounderAdmin(role: string | null | undefined): boolean {
  return FOUNDER_ROLES.has((role ?? "") as MilanRole);
}

export function isOperatorOrFounder(role: string | null | undefined): boolean {
  return OPERATOR_ROLES.has((role ?? "") as MilanRole);
}

export function isVA(role: string | null | undefined): boolean {
  return VA_ROLES.has((role ?? "") as MilanRole);
}

export function isClient(role: string | null | undefined): boolean {
  return CLIENT_ROLES.has((role ?? "") as MilanRole);
}

// ── Guard functions (throw on violation) ─────────────────────────────────────
export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export function assertFounderAdmin(role: string | null | undefined): void {
  if (!isFounderAdmin(role)) {
    throw new AccessDeniedError("This action requires founder administrator access.");
  }
}

export function assertOperatorOrFounder(role: string | null | undefined): void {
  if (!isOperatorOrFounder(role)) {
    throw new AccessDeniedError("This action requires operator or founder access.");
  }
}

export function assertVAAllowed(
  role: string | null | undefined,
  action: string
): void {
  if (isVA(role) && VA_FORBIDDEN_ACTIONS.has(action)) {
    throw new AccessDeniedError(
      `Action "${action}" is not permitted for this access level. Escalate to your coordinator.`
    );
  }
}

export function assertClientOwnsMatter(
  userEmail: string | null | undefined,
  matterClientEmail: string | null | undefined
): void {
  if (!userEmail || !matterClientEmail) {
    throw new AccessDeniedError("Matter ownership could not be verified.");
  }
  if (userEmail.toLowerCase().trim() !== matterClientEmail.toLowerCase().trim()) {
    throw new AccessDeniedError("Access to this matter is not authorized.");
  }
}

// ── Action permission check (non-throwing) ────────────────────────────────────
export function canPerformAction(
  role: string | null | undefined,
  action: string
): boolean {
  if (FOUNDER_ONLY_ACTIONS.has(action)) return isFounderAdmin(role);
  if (VA_FORBIDDEN_ACTIONS.has(action) && isVA(role)) return false;
  return isOperatorOrFounder(role) || isFounderAdmin(role);
}
