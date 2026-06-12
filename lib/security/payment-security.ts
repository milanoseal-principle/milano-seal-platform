// Payment Security Controls
// Hard rules for payment gate enforcement.
// Complements lib/safety/payment-integrity.ts — this layer adds
// event definitions and founder-gate enforcement.

export type PaymentSecurityEvent =
  | "PAYMENT_GATE_CREATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_CONFIRMED_MANUAL"
  | "PAYMENT_GATE_UNLOCKED"
  | "PAYMENT_CONFIRMATION_REJECTED"
  | "PLATFORM_FEE_ONLY_CONFIRMED";

// Validates that a manual payment confirmation is only allowed by founder_admin.
// Returns a result object — never throws (callers decide how to handle).
export function validateManualPaymentConfirmation(params: {
  actorRole: string | null | undefined;
  matterId: string | null | undefined;
  amount: number | null | undefined;
  currency: string | null | undefined;
  reference: string | null | undefined;
}): { allowed: boolean; reason: string | null } {
  if (!params.actorRole || params.actorRole !== "founder_admin") {
    return {
      allowed: false,
      reason: "Manual payment confirmation requires founder administrator access.",
    };
  }
  if (!params.matterId) return { allowed: false, reason: "Matter ID is required." };
  if (!params.amount || params.amount <= 0) return { allowed: false, reason: "Valid amount is required." };
  if (!params.currency) return { allowed: false, reason: "Currency is required." };
  if (!params.reference) return { allowed: false, reason: "Payment reference is required." };
  return { allowed: true, reason: null };
}

// Idempotency check — returns true if this payment has already been confirmed.
// Callers should check before writing a duplicate PAYMENT_CONFIRMED event.
export function isPaymentAlreadyConfirmed(matter: {
  payment_confirmed: boolean;
  payment_confirmed_at?: string | Date | null;
}): boolean {
  return matter.payment_confirmed === true;
}

// Returns the correct ledger event name for a payment confirmation.
export function resolvePaymentEvent(params: {
  isManual: boolean;
  isPlatformFeeOnly: boolean;
}): PaymentSecurityEvent {
  if (params.isPlatformFeeOnly) return "PLATFORM_FEE_ONLY_CONFIRMED";
  return params.isManual ? "PAYMENT_CONFIRMED_MANUAL" : "PAYMENT_CONFIRMED";
}

// Client-safe: never expose Wise link, bank details, or webhook data.
// Returns whether the Wise payment link should be shown to the client.
export function shouldShowWiseLink(matter: {
  payment_confirmed: boolean;
  is_platform_fee_only: boolean;
}): boolean {
  if (matter.is_platform_fee_only) return false;   // Always suppressed
  if (matter.payment_confirmed) return false;       // No longer needed
  return true;
}

// Operator copy for payment events — dashboard only.
export const PAYMENT_EVENT_LABELS: Record<PaymentSecurityEvent, string> = {
  PAYMENT_GATE_CREATED:           "Payment gate created",
  PAYMENT_CONFIRMED:              "Payment confirmed via webhook",
  PAYMENT_CONFIRMED_MANUAL:       "Payment confirmed manually by founder",
  PAYMENT_GATE_UNLOCKED:          "Payment gate unlocked — scheduling available",
  PAYMENT_CONFIRMATION_REJECTED:  "Payment confirmation rejected",
  PLATFORM_FEE_ONLY_CONFIRMED:    "Platform fee confirmed",
};
