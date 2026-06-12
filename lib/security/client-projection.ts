// Client Portal Projection Guard
// Centralized whitelist of what the client portal is allowed to see.
// Every matter row must pass through projectMatterForClient before
// being sent to any client-facing component or API response.

import { CLIENT_FORBIDDEN_FIELDS } from "./access-control";

// Whitelist — only these fields may be exposed to the client portal.
const CLIENT_ALLOWED_FIELDS = new Set([
  "matter_id",
  "id",
  "client_name",
  "destination_country",
  "document_type",
  "current_state",
  "matter_status",
  "payment_status",
  "payment_confirmed",
  "scheduling_unlocked",
  "is_platform_fee_only",
  "lane_label",
  "assigned_lane",
  "client_safe_pathway_summary",
  "vault_document_status",
  "custody_status",
  "courier_tracking_id",
  "tracking_number_display",
  "tracking_url",
  "release_status",
  "next_action",
  "created_at",
  "updated_at",
]);

// Strip any forbidden field from a raw matter row.
// Returns a new object — never mutates the original.
export function projectMatterForClient(
  matter: Record<string, unknown>
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(matter)) {
    if (CLIENT_ALLOWED_FIELDS.has(key) && !CLIENT_FORBIDDEN_FIELDS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

// Returns true if a payload contains any forbidden client field.
// Use in tests and server-side validation before sending portal responses.
export function assertNoForbiddenClientFields(
  payload: Record<string, unknown>
): void {
  const violations: string[] = [];
  for (const key of Object.keys(payload)) {
    if (CLIENT_FORBIDDEN_FIELDS.has(key)) violations.push(key);
  }
  if (violations.length > 0) {
    throw new Error(
      `Client projection violation — forbidden fields present: ${violations.join(", ")}`
    );
  }
}

// Checks a payload without throwing — returns the list of violations.
export function findForbiddenClientFields(
  payload: Record<string, unknown>
): string[] {
  return Object.keys(payload).filter((k) => CLIENT_FORBIDDEN_FIELDS.has(k));
}

// Safe display label for payment status (client-facing only).
export function clientSafePaymentLabel(
  paymentConfirmed: boolean,
  isPlatformFeeOnly: boolean
): string {
  if (isPlatformFeeOnly) {
    return paymentConfirmed ? "Scheduling Unlocked" : "Platform Fee Required";
  }
  return paymentConfirmed ? "Payment Confirmed" : "Awaiting Payment";
}
