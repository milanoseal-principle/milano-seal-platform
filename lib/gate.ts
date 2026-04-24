export function requirePaid(deal: { payment_status: string; id?: string }): void {
  if (deal.payment_status !== "paid") {
    throw new Error("PAYMENT_REQUIRED_BEFORE_EXECUTION")
  }
}

// Status machine — valid forward transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  new:              ["reviewing"],
  reviewing:        ["quoted"],
  quoted:           ["awaiting_payment"],
  awaiting_payment: ["scheduled"],
  scheduled:        ["in_execution"],
  in_execution:     ["apostille", "completed"],
  apostille:        ["shipped"],
  shipped:          ["completed"],
  completed:        [],
  lost:             [],
}

export function validateTransition(from: string, to: string, adminOverride = false): void {
  if (adminOverride) return
  const allowed = VALID_TRANSITIONS[from] || []
  if (!allowed.includes(to)) {
    throw new Error(`INVALID_STATUS_TRANSITION: ${from} → ${to}. Allowed next: ${allowed.join(", ") || "none"}`)
  }
}

export function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    intake_received:      "new",
    under_review:         "reviewing",
    apostille_processing: "apostille",
    paid:                 "awaiting_payment",
  }
  return map[status] || status
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new:              "New",
    reviewing:        "Reviewing",
    quoted:           "Quoted",
    awaiting_payment: "Awaiting Payment",
    scheduled:        "Scheduled",
    in_execution:     "In Execution",
    apostille:        "Apostille Processing",
    shipped:          "Shipped",
    completed:        "Completed",
    lost:             "Lost",
  }
  return labels[status] || status
}
