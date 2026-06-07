export const VA_ALLOWED_TASK_TYPES = [
  "document_prep",
  "checklist",
  "courier_review",
  "ron_reminder",
  "follow_up",
  "missing_info",
  "draft_message",
  "escalation",
  "packaging_checklist",
  "signer_confirmation",
  "translation_review",
] as const;

export type VAAllowedTaskType = typeof VA_ALLOWED_TASK_TYPES[number];

export const VA_BLOCKED_FIELDS = [
  "label_url",
  "actual_shippo_cost",
  "shipping_cost",
  "carrier_account",
  "margin",
  "base_cost",
  "wise_payload",
  "wise_reference",
  "full_signing_url",
  "bn_signing_url",
  "base64Doc",
  "raw_event",
  "raw_webhook",
  "operator_notes",
  "internal_notes",
  "source_vault",
  "storage_path",
  "file_path",
  "file_url",
] as const;

export function assertNoBlockedFields(obj: Record<string, unknown>): void {
  for (const field of VA_BLOCKED_FIELDS) {
    if (field in obj) {
      throw new Error(`VA_SECURITY: blocked field "${field}" in response`);
    }
  }
}
