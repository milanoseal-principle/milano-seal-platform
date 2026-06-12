// Payment Integrity Gate
// Hard rules: no scheduling or execution without payment_confirmed = true.
// platform_fee_only matters must suppress Wise.
// All confirmation events are idempotent and write to ledger.

export type PaymentStatus =
  | "awaiting_payment"
  | "payment_confirmed"
  | "scheduling_unlocked"
  | "platform_fee_only"
  | "manual_founder_confirmation";

export type PaymentIntegrityResult = {
  schedulingAllowed: boolean;
  executionAllowed: boolean;
  showWise: boolean;
  statusLabel: string;
  operatorNote: string | null;
};

export type PaymentLedgerEvent =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_CONFIRMED_MANUAL"
  | "PAYMENT_INTEGRITY_REVIEWED";

// Core gate check — deterministic, no DB calls.
// Call this before unlocking scheduling or execution on any matter.
export function evaluatePaymentIntegrity(matter: {
  payment_confirmed: boolean;
  is_platform_fee_only: boolean;
  payment_status?: string | null;
}): PaymentIntegrityResult {
  const { payment_confirmed, is_platform_fee_only } = matter;

  if (is_platform_fee_only) {
    return {
      schedulingAllowed: payment_confirmed,
      executionAllowed: payment_confirmed,
      showWise: false,          // Wise always suppressed for platform-fee-only
      statusLabel: payment_confirmed ? "Scheduling Unlocked" : "Platform Fee Only",
      operatorNote: "Platform fee only — Wise suppressed. External platform fee required.",
    };
  }

  if (!payment_confirmed) {
    return {
      schedulingAllowed: false,
      executionAllowed: false,
      showWise: true,
      statusLabel: "Awaiting Payment",
      operatorNote: "Payment not yet confirmed. Scheduling and execution locked.",
    };
  }

  return {
    schedulingAllowed: true,
    executionAllowed: true,
    showWise: false,            // Wise link no longer needed once confirmed
    statusLabel: "Payment Confirmed",
    operatorNote: null,
  };
}

// Returns the client-safe payment status label.
export function getClientPaymentStatusLabel(matter: {
  payment_confirmed: boolean;
  is_platform_fee_only: boolean;
}): string {
  if (matter.is_platform_fee_only)
    return matter.payment_confirmed ? "Scheduling Unlocked" : "Platform Fee Only";
  if (!matter.payment_confirmed) return "Awaiting Payment";
  return "Payment Confirmed";
}

// Validates that a manual payment confirmation record has all required fields.
export function validatePaymentRecord(record: {
  matter_id?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  payment_status?: string;
}): { valid: boolean; missing: string[] } {
  const required = ["matter_id", "amount", "currency", "reference", "payment_status"];
  const missing = required.filter((k) => !record[k as keyof typeof record]);
  return { valid: missing.length === 0, missing };
}
