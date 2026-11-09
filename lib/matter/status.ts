// Matter Status Unification — single normalized phase model.
//
// The platform has two historical status vocabularies:
//   - DealStatus  (lib/stateMachine.ts)        — the production DB value on
//     `deals.deal_status`, CHECK-constrained to 11 values. SOURCE OF TRUTH.
//   - MatterStatus (src/features/milano/types.ts) — a richer 20-value vocabulary
//     used by newer feature code, NOT yet persisted to the DB.
//
// This module is a COMPATIBILITY LAYER, not a replacement: it maps any raw status
// string from either vocabulary into one CanonicalStatus so that dashboard, portal,
// ledger, and notifications all read the same normalized phase. It changes no DB
// value and requires no migration. Resolvers below give the canonical next action,
// blocked reason, and the two label sets (client-safe vs operator).

import type { DealStatus } from "@/lib/stateMachine";
import type { MatterStatus } from "@/src/features/milano/types";

export type CanonicalStatus =
  | "intake_received"
  | "under_review"
  | "quoted"
  | "awaiting_payment"
  | "payment_review"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "apostille_received"
  | "final_payment_due"
  | "ready_for_release"
  | "shipped"
  | "delivered"
  | "completed"
  | "lost"
  | "dormant";

// Ordered lifecycle (excludes terminal-negative `lost`/`dormant`) for progress UIs.
export const CANONICAL_ORDER: CanonicalStatus[] = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "payment_review",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "apostille_received",
  "final_payment_due",
  "ready_for_release",
  "shipped",
  "delivered",
  "completed",
];

// Every raw status from BOTH vocabularies maps here. Keys are exhaustive over
// DealStatus ∪ MatterStatus; the status-drift validator enforces completeness.
export const STATUS_TO_CANONICAL: Record<string, CanonicalStatus> = {
  // --- DealStatus (DB, source of truth) ---
  new: "intake_received",
  reviewing: "under_review",
  quoted: "quoted",
  awaiting_payment: "awaiting_payment",
  scheduled: "scheduled",
  in_execution: "in_execution",
  apostille: "apostille_processing",
  shipped: "shipped",
  completed: "completed",
  lost: "lost",
  // --- MatterStatus (richer vocabulary) ---
  intake_received: "intake_received",
  under_review: "under_review",
  quote_generated: "quoted",
  payment_pending_review: "payment_review",
  deposit_paid: "scheduled",
  scheduling_unlocked: "scheduled",
  ron_completed: "in_execution",
  apostille_processing: "apostille_processing",
  apostille_received: "apostille_received",
  final_payment_required: "final_payment_due",
  final_paid: "ready_for_release",
  ready_for_release: "ready_for_release",
  delivered: "delivered",
  dormant: "dormant",
};

/** Normalize any raw status string (either vocabulary) to a CanonicalStatus. */
export function normalizeStatus(
  raw: DealStatus | MatterStatus | string | null | undefined,
): CanonicalStatus {
  if (!raw) return "under_review";
  return STATUS_TO_CANONICAL[raw] ?? "under_review";
}

// Client-safe labels — calm, no internal mechanics, no margins, no legal advice.
export const PORTAL_LABELS: Record<CanonicalStatus, string> = {
  intake_received: "Matter Received",
  under_review: "Under Review",
  quoted: "Proposal Issued",
  awaiting_payment: "Awaiting Payment Authorization",
  payment_review: "Payment Under Review",
  scheduled: "Execution Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille / Authentication in Progress",
  apostille_received: "Apostille / Authentication Received",
  final_payment_due: "Final Payment Due",
  ready_for_release: "Preparing Secure Release",
  shipped: "In Transit",
  delivered: "Delivered",
  completed: "Complete",
  lost: "Closed",
  dormant: "On Hold",
};

// Operator labels — precise internal phase names.
export const OPERATOR_LABELS: Record<CanonicalStatus, string> = {
  intake_received: "Intake Received",
  under_review: "Intake / Compliance Review",
  quoted: "Quoted",
  awaiting_payment: "Awaiting Payment",
  payment_review: "Payment Mismatch Review",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille / Authentication Processing",
  apostille_received: "Apostille / Authentication Received",
  final_payment_due: "Final Balance Due",
  ready_for_release: "Ready for Release (gated)",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  lost: "Lost / Closed",
  dormant: "Dormant",
};

// Operator-facing next action per phase. Client never mutates status directly;
// these are the operator's allowed forward moves.
export const NEXT_ACTION: Record<CanonicalStatus, string> = {
  intake_received: "Review intake and confirm document/jurisdiction details",
  under_review: "Complete compliance review and issue proposal",
  quoted: "Send payment instructions",
  awaiting_payment: "Confirm payment verified and cleared (payment-gated)",
  payment_review: "Resolve payment mismatch before scheduling",
  scheduled: "Begin controlled execution (RON / mobile / witness)",
  in_execution: "Complete execution QA and submit apostille/authentication",
  apostille_processing: "Await apostille/authentication completion",
  apostille_received: "Request final balance",
  final_payment_due: "Confirm final payment cleared (release-gated)",
  ready_for_release: "Pass release gate, then create courier label",
  shipped: "Track shipment to delivery",
  delivered: "Confirm receipt and close matter",
  completed: "None — matter complete",
  lost: "None — matter closed",
  dormant: "Re-engage or close",
};

export interface MatterGateContext {
  paymentCleared?: boolean;
  identifierLockSatisfied?: boolean;
  finalPaymentCleared?: boolean;
}

/**
 * Blocked-reason resolver. Returns a short reason a matter cannot advance from the
 * given phase, or null if not blocked. Mirrors the real release/payment gates;
 * does not itself gate (the gates live in performFinalRelease / payment gate).
 */
export function blockedReason(
  status: CanonicalStatus,
  gates: MatterGateContext = {},
): string | null {
  switch (status) {
    case "awaiting_payment":
      return gates.paymentCleared
        ? null
        : "Payment must be verified and cleared before scheduling";
    case "payment_review":
      return "Payment mismatch is under review";
    case "ready_for_release":
      if (!gates.finalPaymentCleared)
        return "Final payment must clear before release, or a founder override is required";
      if (gates.identifierLockSatisfied === false)
        return "Identifier lock (exact match) required before release";
      return null;
    default:
      return null;
  }
}

export function isTerminalCanonical(status: CanonicalStatus): boolean {
  return status === "completed" || status === "lost";
}

export function canonicalIndex(status: CanonicalStatus): number {
  return CANONICAL_ORDER.indexOf(status);
}
