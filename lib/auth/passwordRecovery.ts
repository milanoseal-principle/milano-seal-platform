// Classifies the Supabase Auth password-recovery result for the reset-request route.
//
// Enumeration safety: Supabase returns success immediately for an unregistered address, and only
// looks at mail limits (per-user RecoverySentAt cooldown, project send cap) or SMTP delivery for a
// registered one. Any error produced at that stage is therefore account-dependent; surfacing it
// would let a caller learn that an address is registered by submitting it twice. Those errors are
// answered exactly like an accepted request and logged by code for the operator instead.
//
// Only refusals that apply equally to every address are reported to the caller: the per-client
// request limit (over_request_rate_limit) and the provider being unreachable at all.

export type RecoveryOutcome = {
  status: number;
  body: { ok: true } | { ok: false; code: "INVALID_EMAIL" | "RATE_LIMITED" | "RECOVERY_UNAVAILABLE"; message: string };
  // Set when a provider error was withheld from the caller; logged server-side, never returned.
  withheldCode?: string;
};

export function isPlausibleEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function classifyRecoveryResult(error: { status?: number; code?: string } | null | undefined): RecoveryOutcome {
  if (!error) return { status: 200, body: { ok: true } };
  if (error.code === "over_request_rate_limit") {
    return {
      status: 429,
      body: {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many reset requests have been made from this connection. Please wait a few minutes before trying again.",
      },
    };
  }
  // Account-dependent (mail cooldown, send cap, SMTP failure, or unknown): indistinguishable from success.
  return { status: 200, body: { ok: true }, withheldCode: error.code || `status_${error.status ?? "unknown"}` };
}

// The provider could not be reached at all: no account lookup happened, so this is the same for every address.
export const RECOVERY_UNREACHABLE_OUTCOME: RecoveryOutcome = {
  status: 503,
  body: {
    ok: false,
    code: "RECOVERY_UNAVAILABLE",
    message: "We could not send a reset email right now. Please try again shortly or contact your Matter coordinator.",
  },
};

export const INVALID_EMAIL_OUTCOME: RecoveryOutcome = {
  status: 400,
  body: { ok: false, code: "INVALID_EMAIL", message: "Enter a valid email address." },
};
