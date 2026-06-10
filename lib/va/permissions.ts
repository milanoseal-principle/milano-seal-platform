// VA Permission Rules
// Extends existing vaPermissions.ts in components/va/

export const VA_PORTAL_ALLOWED = [
  "read_matter_summary",
  "read_packet_flags",
  "read_reconciliation_flags",
  "read_wise_reference",        // reference number only, not payload
  "read_tracking_number",       // tracking number only, not label_url
  "prepare_support_note",
  "request_operator_review",
  "prepare_client_followup",
  "flag_needs_review",
  "mark_client_contacted",
  "view_next_safe_action",
  "copy_safe_reference",
] as const;

export const VA_PORTAL_BLOCKED = [
  "payment_confirmation",
  "document_release",
  "final_completion",
  "delete_file",
  "edit_client_identity",
  "export_sensitive_data",
  "change_state_machine_directly",
  "override_payment_gate",
  "confirm_payment",
  "mark_payment_confirmed",
  "release_courier",
  "approve_apostille_dispatch",
  "sign_document",
  "generate_label",
] as const;

export type VAPortalAllowed = typeof VA_PORTAL_ALLOWED[number];
export type VAPortalBlocked = typeof VA_PORTAL_BLOCKED[number];

export function isVAActionAllowed(action: string): boolean {
  return (VA_PORTAL_ALLOWED as readonly string[]).includes(action);
}

export function isVAActionBlocked(action: string): boolean {
  return (VA_PORTAL_BLOCKED as readonly string[]).includes(action);
}

// Payment gate check — VA must never advance a matter without this
export function assertPaymentGate(paymentConfirmed: boolean, action: string): void {
  const gatedActions = [
    "schedule_execution",
    "dispatch_apostille",
    "release_courier",
    "release_document",
    "mark_completed",
    "approve_release",
  ];
  if (gatedActions.includes(action) && !paymentConfirmed) {
    throw new Error("PAYMENT_GATE_VIOLATION");
  }
}
