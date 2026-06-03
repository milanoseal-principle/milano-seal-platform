// Wise transfer state → Milano payment status
// Source: https://docs.wise.com/api-docs/features/webhooks-notifications/transfer-webhooks

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

// IMPORTANT: outgoing_payment_sent = outbound transfer from Milano to someone else.
// Inbound client payments arrive via balances#credit or swift-in#credit.
// Confirm exact event with Wise account manager before relying on transfer state for inbound.
const TRANSFER_STATE_MAP: Record<string, MilanoPaymentStatus> = {
  incoming_payment_waiting:   "PAYMENT_PENDING",
  incoming_payment_initiated: "PAYMENT_PENDING",
  processing:                 "PAYMENT_PENDING",
  funds_converted:            "PAYMENT_PENDING",
  outgoing_payment_sent:      "PAYMENT_REVIEW_REQUIRED", // outbound — not a client payment
  cancelled:                  "PAYMENT_FAILED",
  funds_refunded:             "PAYMENT_REFUNDED",
  bounced_back:               "PAYMENT_REVIEW_REQUIRED",
  charged_back:               "PAYMENT_REVIEW_REQUIRED",
  unknown:                    "PAYMENT_REVIEW_REQUIRED",
};

export function mapWiseTransferState(state: string): MilanoPaymentStatus {
  return TRANSFER_STATE_MAP[state] ?? "PAYMENT_REVIEW_REQUIRED";
}

// Inbound balance credit events — require reference/amount match before confirming
export function mapWiseBalanceEvent(eventType: string): MilanoPaymentStatus {
  if (eventType === "balances#credit" || eventType === "swift-in#credit") {
    return "PAYMENT_REVIEW_REQUIRED"; // always requires reconciliation
  }
  return "PAYMENT_REVIEW_REQUIRED";
}

export function isTerminalPaymentStatus(status: MilanoPaymentStatus): boolean {
  return (
    status === "PAYMENT_CONFIRMED" ||
    status === "PAYMENT_FAILED" ||
    status === "PAYMENT_REFUNDED"
  );
}

export function toCopilotSeverity(status: MilanoPaymentStatus): "CRITICAL" | "HIGH" | "MEDIUM" {
  if (status === "PAYMENT_FAILED" || status === "PAYMENT_REVIEW_REQUIRED") return "CRITICAL";
  if (status === "PAYMENT_REFUNDED") return "HIGH";
  return "MEDIUM";
}
