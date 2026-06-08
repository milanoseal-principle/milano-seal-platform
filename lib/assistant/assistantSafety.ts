export const BLOCKED_FIELD_TOKENS = [
  'label_url', 'actual_shippo_cost', 'shipping_cost', 'margin', 'base_cost',
  'raw_event', 'raw_webhook', 'operator_notes', 'internal_notes', 'wise_payload',
  'source_vault', 'client_documents', 'full_signing_url', 'bn_signing_url',
  'base64Doc', 'storage_path', 'file_path', 'file_url',
  'SUPABASE_SERVICE_ROLE_KEY', 'SHIPPO_API_KEY', 'BLUENOTARY_API_KEY',
];

export const FORBIDDEN_EXPRESSIONS = [
  'Mission Control', 'Sovereign Command', 'Sovereign OS', 'System Terminal',
  'AI lawyer', 'legal advice guaranteed', 'guaranteed acceptance',
  'government approved', 'embassy verified',
];

export function sanitizeTextPayload(text: string): string {
  let out = text;
  for (const expr of FORBIDDEN_EXPRESSIONS) {
    out = out.replace(new RegExp(expr, 'gi'), '[redacted]');
  }
  return out;
}

export function enforceSecureProjection<T extends Record<string, unknown>>(
  rawPayload: T,
  allowedKeys: string[]
): Partial<T> {
  const safe: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in rawPayload && !BLOCKED_FIELD_TOKENS.includes(key)) {
      safe[key as keyof T] = rawPayload[key as keyof T];
    }
  }
  return safe;
}
