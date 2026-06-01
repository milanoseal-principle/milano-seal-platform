// Partner-safe field enforcement
// These functions ensure no sensitive data reaches partner-facing surfaces.

const ALLOWED_PARTNER_FIELDS = new Set([
  "referral_id", "submitted_at", "destination_country",
  "document_type", "matter_type", "status", "public_next_step",
]);

export function stripReferralSensitiveFields(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => ALLOWED_PARTNER_FIELDS.has(key))
  );
}

export function assertNoPartnerLeak(payload: Record<string, unknown>): void {
  const forbidden = [
    "margin", "base_cost", "revenue", "payout", "shipping_cost",
    "operator_notes", "internal_notes", "source_vault", "label_url",
    "storage_path", "client_email", "client_phone",
  ];
  for (const field of forbidden) {
    if (field in payload) {
      throw new Error(`[PARTNER_LEAK_GUARD] Forbidden field "${field}" in partner payload`);
    }
  }
}
