// Classifies the Supabase Auth password-recovery result for the reset-request route.
//
// Supabase does not reveal whether an address is registered: an unknown address returns no error.
// So distinguishing an ACCEPTED request from a provider REJECTION (rate limit, SMTP failure)
// does not enumerate accounts. Reporting success when the provider refused to send (2026-11-15:
// HTTP 429 over_email_send_rate_limit) told clients to check an inbox that would never receive mail.

export type RecoveryOutcome = {
  status: number;
  body: { ok: true } | { ok: false; code: "INVALID_EMAIL" | "RATE_LIMITED" | "RECOVERY_UNAVAILABLE"; message: string };
};

const RATE_LIMIT_CODES = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);

export function isPlausibleEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function classifyRecoveryResult(error: { status?: number; code?: string } | null | undefined): RecoveryOutcome {
  if (!error) return { status: 200, body: { ok: true } };
  if (error.status === 429 || (error.code && RATE_LIMIT_CODES.has(error.code))) {
    return {
      status: 429,
      body: {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many reset emails have been requested recently. Please wait a few minutes before trying again.",
      },
    };
  }
  return {
    status: 503,
    body: {
      ok: false,
      code: "RECOVERY_UNAVAILABLE",
      message: "We could not send a reset email right now. Please try again shortly or contact your Matter coordinator.",
    },
  };
}

export const INVALID_EMAIL_OUTCOME: RecoveryOutcome = {
  status: 400,
  body: { ok: false, code: "INVALID_EMAIL", message: "Enter a valid email address." },
};
