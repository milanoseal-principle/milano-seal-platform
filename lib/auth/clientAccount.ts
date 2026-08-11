// Client self-service account creation — shared, pure helpers.
//
// Ownership model (canonical): a client sees a Matter when their CONFIRMED
// Supabase auth email equals the Matter's stored email, enforced by the
// email-based RLS policy `client_own_deal`. There is intentionally no
// client_user_id column and no second ownership path. The security guarantee
// therefore rests on two things this module standardizes:
//   1. the email is normalized identically wherever it is compared, and
//   2. the account's email is verified (confirmed) before it is trusted.
// These functions are pure so the normalization/validation contract is unit
// tested without a network or Supabase.

export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

// Deliberately conservative, no substring/loose matching: exact equality of
// the normalized forms. Empty never matches (fail closed).
export function emailsMatch(a: unknown, b: unknown): boolean {
  const na = normalizeEmail(a);
  const nb = normalizeEmail(b);
  return na.length > 0 && na === nb;
}

// RFC-pragmatic: exactly one @, non-empty local part, a dotted domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CredentialCheck {
  ok: boolean;
  email: string;
  error?: string;
}

export function validateSignupCredentials(rawEmail: unknown, rawPassword: unknown): CredentialCheck {
  const email = normalizeEmail(rawEmail);
  const password = String(rawPassword ?? "");

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, email, error: "A valid email address is required." };
  }
  if (password.length < 8) {
    return { ok: false, email, error: "Password must be at least 8 characters." };
  }
  if (password.length > 200) {
    return { ok: false, email, error: "Password is too long." };
  }
  return { ok: true, email };
}

// Generic, enumeration-safe response text: never reveals whether an email is
// already registered or whether a Matter exists for it.
export const SIGNUP_CONFIRMATION_MESSAGE =
  "Check your email to confirm your account, then sign in to view your matter.";
