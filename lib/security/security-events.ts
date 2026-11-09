// Security Event Recording
// Lightweight, fail-silent event log for security-relevant actions.
// Never blocks client workflow. Never exposes client secrets in metadata.

export type SecurityEventName =
  | "UNAUTHORIZED_PORTAL_ACCESS_ATTEMPT"
  | "ADMIN_ACTION_DENIED"
  | "VA_ACTION_DENIED"
  | "CLIENT_FIELD_PROJECTION_BLOCKED"
  | "PAYMENT_CONFIRMATION_REJECTED"
  | "FINAL_RELEASE_BLOCKED"
  | "FINAL_RELEASE_APPROVED"
  | "PAYMENT_RELEASE_OVERRIDE_APPROVED"
  | "IDENTIFIER_MISMATCH_BLOCKED"
  | "IDENTIFIER_EXACT_MATCH_CONFIRMED"
  | "RAW_PAYLOAD_EXPOSURE_PREVENTED"
  | "INVALID_DESTINATION_PARAM_IGNORED"
  | "VERIFY_LOOKUP_RATE_LIMITED"
  | "AI_INTAKE_PARSED"
  | "AI_RECOMMENDATION_REVIEW_REQUIRED"
  | "AI_IDENTIFIER_CHANGE_BLOCKED"
  | "AI_FINAL_RELEASE_DENIED"
  | "GOVERNANCE_SCHEDULER_FAILURE";

export type SecurityEventSeverity = "info" | "warning" | "high" | "critical";

export type SecurityEventPayload = {
  event_name: SecurityEventName;
  severity: SecurityEventSeverity;
  actor?: string;
  matter_id?: string;
  route?: string;
  client_safe: boolean;
  metadata?: Record<string, string | number | boolean | null>;
};

// Records a security event to console in development, Supabase in production.
// Fail-silent — never throws, never blocks the caller.
export async function recordSecurityEvent(
  payload: SecurityEventPayload
): Promise<void> {
  try {
    // Strip any accidental secrets from metadata before storing
    const safeMetadata = payload.metadata
      ? sanitizeEventMetadata(payload.metadata)
      : undefined;

    if (process.env.NODE_ENV === "development") {
      console.warn(`[SecurityEvent] ${payload.event_name}`, {
        severity: payload.severity,
        actor: payload.actor,
        matter_id: payload.matter_id,
        route: payload.route,
        ...safeMetadata,
      });
      return;
    }

    // Reuse the actual security audit schema; custody rows require a Matter,
    // event and cryptographic linkage and cannot serve as a loose logging sink.
    const {createAdminClient}=await import('@/lib/supabase/admin');
    const result=await createAdminClient().from('audit_events').insert({
      actor_id:payload.actor&&/^[a-f0-9-]{36}$/i.test(payload.actor)?payload.actor:null,
      event_type:`SECURITY_${payload.event_name}`,route:payload.route??null,
      metadata:{visibility:'AUDIT',severity:payload.severity,matter_id:payload.matter_id??null,client_safe:payload.client_safe,...safeMetadata},
    });
    if(result.error)console.error('[security] AUDIT_EVENT_RECORD_NOT_CONFIRMED',{code:result.error.code});
  } catch {
    console.error('[security] AUDIT_EVENT_RECORD_NOT_CONFIRMED'); // Logging cannot authorize or block the transaction.
  }
}

// Forbidden metadata keys — strip before any event is stored.
const FORBIDDEN_METADATA_KEYS = new Set([
  "service_role_key",
  "raw_webhook",
  "raw_payload",
  "password",
  "token",
  "secret",
  "api_key",
  "anon_key",
  "bank_account",
  "card_number",
  "margin",
  "net_margin",
  "discount_reason",
  "internal_reason",
  "operator_notes",
]);

function sanitizeEventMetadata(
  metadata: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!FORBIDDEN_METADATA_KEYS.has(key.toLowerCase())) {
      safe[key] = value;
    }
  }
  return safe;
}
