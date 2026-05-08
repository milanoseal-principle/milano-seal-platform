export type PaymentStatus =
  | "awaiting_payment"
  | "payment_pending"
  | "payment_confirmed"
  | "payment_failed"
  | "partially_paid"
  | "refunded";

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  awaiting_payment: ["payment_pending", "payment_confirmed", "payment_failed"],
  payment_pending: ["payment_confirmed", "payment_failed", "partially_paid"],
  partially_paid: ["payment_confirmed", "payment_failed"],
  payment_confirmed: ["refunded"],
  payment_failed: ["payment_pending", "awaiting_payment"],
  refunded: [],
};

export const TERMINAL_STATUSES: PaymentStatus[] = [
  "payment_confirmed",
  "refunded",
];

export function isValidPaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  awaiting_payment: "AWAITING",
  payment_pending: "PROCESSING",
  payment_confirmed: "CONFIRMED",
  payment_failed: "FAILED",
  partially_paid: "PARTIAL",
  refunded: "REFUNDED",
};
