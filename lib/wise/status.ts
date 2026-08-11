// Wise transfer state → Milano payment status
// Source: https://docs.wise.com/guides/product/send-money/tracking/transfer-statuses

export type WiseTransferState =
  | "incoming_payment_waiting"
  | "incoming_payment_initiated"
  | "processing"
  | "funds_converted"
  | "outgoing_payment_sent"
  | "cancelled"
  | "funds_refunded"
  | "bounced_back"
  | "charged_back"
  | "unknown";

export type MilanoPaymentStatus =
  | "AWAITING_PAYMENT"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_REVIEW_REQUIRED";

// IMPORTANT: transfer state changes describe Wise transfers created by Milano.
// They are not authoritative proof that a client paid Milano. Never unlock a
// client matter from outbound transfer state alone.
const TRANSFER_STATE_MAP: Record<string, MilanoPaymentStatus> = {
  incoming_payment_waiting: "PAYMENT_PENDING",
  incoming_payment_initiated: "PAYMENT_PENDING",
  processing: "PAYMENT_PENDING",
  funds_converted: "PAYMENT_PENDING",
  outgoing_payment_sent: "PAYMENT_REVIEW_REQUIRED",
  cancelled: "PAYMENT_FAILED",
  funds_refunded: "PAYMENT_REFUNDED",
  bounced_back: "PAYMENT_REVIEW_REQUIRED",
  charged_back: "PAYMENT_REVIEW_REQUIRED",
  unknown: "PAYMENT_REVIEW_REQUIRED",
};

export function mapWiseTransferState(state: string): MilanoPaymentStatus {
  return TRANSFER_STATE_MAP[state] ?? "PAYMENT_REVIEW_REQUIRED";
}

// Inbound receive events are deliberately fail-closed.
// balances#credit is deprecated by Wise and does not carry Milano's invoice /
// matter reference in the documented payload. balances#update also must not be
// treated as payment authority merely because a balance changed.
// swift-in#credit can carry a payment reference, but confirmation still requires
// exact reference + amount + currency matching in the webhook handler.
export function mapWiseBalanceEvent(eventType: string): MilanoPaymentStatus {
  if (eventType === "swift-in#credit") return "PAYMENT_CONFIRMED";
  return "PAYMENT_REVIEW_REQUIRED";
}

export function isTerminalPaymentStatus(status: MilanoPaymentStatus): boolean {
  return (
    status === "PAYMENT_CONFIRMED" ||
    status === "PAYMENT_FAILED" ||
    status === "PAYMENT_REFUNDED"
  );
}

export function toCopilotSeverity(
  status: MilanoPaymentStatus,
): "CRITICAL" | "HIGH" | "MEDIUM" {
  if (status === "PAYMENT_FAILED" || status === "PAYMENT_REVIEW_REQUIRED") {
    return "CRITICAL";
  }
  if (status === "PAYMENT_REFUNDED") return "HIGH";
  return "MEDIUM";
}
