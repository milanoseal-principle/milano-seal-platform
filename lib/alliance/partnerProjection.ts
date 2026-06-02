/**
 * partnerProjection.ts
 *
 * Defines the explicit whitelist of fields that may be returned to Alliance
 * partners. Any field NOT in this list must be stripped before sending a
 * response to the partner-facing API.
 *
 * NEVER expose: internal_notes, operator_notes, margin, base_cost,
 * payment internals, raw Wise payload, other partner records,
 * private uploaded IDs, commission_rate, payout_amount, payout_reference.
 */

// ─── Matter fields safe for partner consumption ───────────────────────────────
export const PARTNER_SAFE_MATTER_FIELDS = [
  "id",
  "matter_ref",
  "client_name",
  "destination_country",
  "document_type",
  "matter_type",
  "status",
  "submitted_at",
  "created_at",
  "updated_at",
] as const;

export type PartnerSafeMatterField = (typeof PARTNER_SAFE_MATTER_FIELDS)[number];

// ─── Commission/ledger fields safe for partner consumption ────────────────────
export const PARTNER_SAFE_COMMISSION_FIELDS = [
  "id",
  "matter_id",
  "commission_status",
  "payout_due_at",
  "payout_paid_at",
  "created_at",
] as const;

export type PartnerSafeCommissionField =
  (typeof PARTNER_SAFE_COMMISSION_FIELDS)[number];

// ─── Fields NEVER returned to partners ───────────────────────────────────────
export const PARTNER_BLOCKED_FIELDS = [
  "internal_notes",
  "operator_notes",
  "margin",
  "base_cost",
  "cost_breakdown",
  "wise_payload",
  "wise_transfer_id",
  "wise_quote_id",
  "payment_method",
  "payment_reference",
  "stripe_payment_intent",
  "payout_amount",
  "commission_rate",
  "payout_reference",
  "ledger_logged_at",
  "partner_name",        // don't leak other partner names
  "partner_id",          // don't expose internal partner IDs in response body
  "referred_by",
  "identity_document_url",
  "passport_url",
  "id_upload_url",
  "raw_submission",
  "admin_notes",
  "operator_id",
  "assigned_operator",
] as const;

export type PartnerBlockedField = (typeof PARTNER_BLOCKED_FIELDS)[number];

// ─── Partner-safe matter status labels ───────────────────────────────────────
// Operators may use more granular internal statuses; partners see only these.
export const PARTNER_STATUS_MAP: Record<string, string> = {
  // Intake / submitted
  submitted: "Received",
  new: "Received",
  received: "Received",

  // Review
  under_review: "In Review",
  pending_review: "In Review",
  reviewing: "In Review",

  // Client action required
  awaiting_client: "Awaiting Client Action",
  client_action_required: "Awaiting Client Action",
  pending_client_docs: "Awaiting Client Action",

  // Active execution
  in_progress: "In Progress",
  in_execution: "In Progress",
  accepted: "In Progress",

  // Authentication phase
  awaiting_authentication: "Awaiting Authentication",
  awaiting_apostille: "Awaiting Authentication",
  awaiting_legalization: "Awaiting Authentication",

  // Transit / delivery
  in_transit: "In Transit",
  shipped: "In Transit",
  dispatched: "In Transit",

  // Done
  completed: "Completed",
  delivered: "Completed",
  closed: "Completed",

  // Documents
  documents_shared: "Documents Shared",
  docs_ready: "Documents Shared",

  // Not accepted / rejected — map to generic label
  not_accepted: "In Review",  // don't expose rejection language to partner
  rejected: "In Review",
};

/**
 * Map an internal matter status to the partner-safe display label.
 * Falls back to "In Review" for unknown statuses to avoid leaking internals.
 */
export function toPartnerStatus(internalStatus: string): string {
  return PARTNER_STATUS_MAP[internalStatus] ?? "In Review";
}

// ─── Commission status labels safe for partners ───────────────────────────────
export const PARTNER_COMMISSION_STATUS_MAP: Record<string, string> = {
  pending: "Pending",
  approved: "Eligible",
  paid: "Paid",
  voided: "On Hold",
  // Catch-all
  needs_review: "Needs Review",
};

export function toPartnerCommissionStatus(internalStatus: string): string {
  return PARTNER_COMMISSION_STATUS_MAP[internalStatus] ?? "Needs Review";
}

/**
 * Strip any blocked fields from a plain object before sending to partner.
 * Pass the result of a DB query through this before returning in an API response.
 */
export function stripBlockedFields<T extends Record<string, unknown>>(
  record: T,
): Partial<T> {
  const blocked = new Set<string>(PARTNER_BLOCKED_FIELDS);
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !blocked.has(key)),
  ) as Partial<T>;
}
