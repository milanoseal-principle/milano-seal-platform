// Client Portal 2.0 — pure status rail derivation.
//
// The rail reflects payment-gated scheduling as a READ-ONLY status. It never
// bypasses the payment gate and never trusts a client-supplied payment state —
// `paymentConfirmed` must be server-derived on the PortalMatter.

import type { MatterStatus, PortalMatter, StatusRailState } from "./types";
import { MATTER_STATUS_ORDER, MATTER_STATUS_LABELS } from "./types";

const NEXT_STEP_COPY: Record<MatterStatus, { next: MatterStatus | null; description: string }> = {
  intake_received: {
    next: "under_review",
    description: "Your coordinator is preparing your document for review.",
  },
  under_review: {
    next: "quoted",
    description: "We are confirming your execution path and preparing a proposal.",
  },
  quoted: {
    next: "awaiting_payment",
    description: "Review your proposal. Payment unlocks scheduling.",
  },
  awaiting_payment: {
    next: "scheduled",
    description: "Scheduling unlocks only after payment is confirmed by the platform.",
  },
  scheduled: {
    next: "in_execution",
    description: "Your execution session is scheduled. Your coordinator will share preparation steps.",
  },
  in_execution: {
    next: "apostille_processing",
    description: "Your documents are being executed. Apostille processing follows.",
  },
  apostille_processing: {
    next: "in_transit",
    description: "Apostille processing is underway. Secure release follows.",
  },
  in_transit: {
    next: "delivered",
    description: "Your documents are with the courier and moving toward delivery.",
  },
  delivered: {
    next: "completed",
    description: "Delivery confirmed. Your matter will be closed shortly.",
  },
  completed: {
    next: null,
    description: "Your matter is complete. Review the Final Release Vault for records.",
  },
};

/**
 * Derive the current rail state and next step from a matter (pure).
 * Payment-gated scheduling is reflected as a read-only status.
 */
export function deriveStatusRail(matter: PortalMatter): StatusRailState {
  const currentIndex = Math.max(0, MATTER_STATUS_ORDER.indexOf(matter.status));
  const current = MATTER_STATUS_ORDER[currentIndex];
  const copy = NEXT_STEP_COPY[current];

  // Read-only reflection of the payment gate. We only report that scheduling
  // is gated — we never flip the gate open from the client side.
  const awaitingPayment = current === "awaiting_payment" && !matter.paymentConfirmed;

  return {
    current,
    currentIndex,
    totalSteps: MATTER_STATUS_ORDER.length,
    currentLabel: MATTER_STATUS_LABELS[current],
    nextStepLabel: copy.next ? MATTER_STATUS_LABELS[copy.next] : null,
    nextStepDescription: awaitingPayment
      ? "Scheduling unlocks only after payment is confirmed by the platform."
      : copy.description,
    awaitingPayment,
    paymentConfirmed: matter.paymentConfirmed,
    isComplete: current === "completed",
  };
}
