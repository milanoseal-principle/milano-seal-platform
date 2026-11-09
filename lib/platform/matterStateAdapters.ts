// Matter State Adapters — canonical state vocabulary over the CONTROLLING
// state machine (lib/stateMachine.ts). This does NOT create a competing machine:
// for states the legacy machine knows, transitions delegate to it; only the
// canonical-only intermediate states (quote_ready, payment_confirmed, delivered,
// on_hold) are supplemented, per the unification spec.
//
// Adapters translate/validate only. They never mutate protected systems and
// never unlock scheduling — the real payment-before-scheduling gate is unchanged.

import { canTransition as legacyCanTransition } from "../stateMachine";

export const CANONICAL_MATTER_STATES = [
  "intake_received",
  "under_review",
  "quote_ready",
  "quoted",
  "awaiting_payment",
  "payment_confirmed",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "on_hold",
] as const;

export type CanonicalMatterState = (typeof CANONICAL_MATTER_STATES)[number];

// Legacy DealStatus (lib/stateMachine.ts) → canonical state.
const LEGACY_TO_CANONICAL: Record<string, CanonicalMatterState> = {
  new: "intake_received",
  reviewing: "under_review",
  quoted: "quoted",
  awaiting_payment: "awaiting_payment",
  scheduled: "scheduled",
  in_execution: "in_execution",
  apostille: "apostille_processing",
  shipped: "in_transit",
  completed: "completed",
  lost: "cancelled",
};

// Canonical → legacy (only where a legacy equivalent exists).
const CANONICAL_TO_LEGACY: Partial<Record<CanonicalMatterState, string>> = {
  intake_received: "new",
  under_review: "reviewing",
  quoted: "quoted",
  awaiting_payment: "awaiting_payment",
  scheduled: "scheduled",
  in_execution: "in_execution",
  apostille_processing: "apostille",
  in_transit: "shipped",
  completed: "completed",
  cancelled: "lost",
};

// Canonical-only supplemental transitions (states the legacy machine lacks).
// Structural scheduling may follow an observed submission while settlement is pending.
// The mutation endpoint and database independently require canonical Wise authority.
const CANONICAL_SUPPLEMENT: Partial<Record<CanonicalMatterState, CanonicalMatterState[]>> = {
  quote_ready: ["quoted", "on_hold", "cancelled"],
  awaiting_payment: ["payment_confirmed", "on_hold", "cancelled"],
  payment_confirmed: ["scheduled", "on_hold"],
  in_transit: ["delivered", "on_hold"],
  delivered: ["completed"],
  on_hold: ["under_review", "quoted", "awaiting_payment", "cancelled"],
};

const LABELS: Record<CanonicalMatterState, string> = {
  intake_received: "Intake Received",
  under_review: "Under Review",
  quote_ready: "Quote Ready",
  quoted: "Quoted",
  awaiting_payment: "Awaiting Payment",
  payment_confirmed: "Payment Confirmed",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille Processing",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

// Operator next-action hint per state (advisory only).
const OPERATOR_ACTIONS: Record<CanonicalMatterState, string> = {
  intake_received: "review_intake",
  under_review: "complete_compliance_review",
  quote_ready: "prepare_quote",
  quoted: "send_quote",
  awaiting_payment: "follow_up_quote",
  payment_confirmed: "schedule_execution",
  scheduled: "confirm_signer_readiness",
  in_execution: "resolve_qa_blocker",
  apostille_processing: "prepare_apostille_packet",
  in_transit: "verify_courier",
  delivered: "authorize_release",
  completed: "capture_case_study",
  cancelled: "review_lost",
  on_hold: "resolve_qa_blocker",
};

function isCanonical(s: string): s is CanonicalMatterState {
  return (CANONICAL_MATTER_STATES as readonly string[]).includes(s);
}

/** Map any legacy status string into a canonical state. Unknown → on_hold (never completed). */
export function mapLegacyMatterState(legacy: string | null | undefined): CanonicalMatterState {
  if (!legacy) return "on_hold";
  if (isCanonical(legacy)) return legacy;
  return LEGACY_TO_CANONICAL[legacy] ?? "on_hold";
}

/** Normalize either a legacy or canonical string to a canonical state. */
export function normalizeMatterState(state: string | null | undefined): CanonicalMatterState {
  return mapLegacyMatterState(state);
}

/**
 * Whether a canonical transition is allowed. Delegates to the controlling
 * legacy machine when both endpoints have legacy equivalents; otherwise consults
 * the canonical supplement. Returns a reason for denials.
 */
export function canTransitionMatterState(
  from: string,
  to: string,
): { allowed: boolean; reason?: string } {
  const f = normalizeMatterState(from);
  const t = normalizeMatterState(to);
  if (f === t) return { allowed: false, reason: "no-op transition" };

  // Structural predecessor validation is separate from canonical Wise authority.
  if (t === "scheduled" && !["awaiting_payment", "payment_confirmed"].includes(f)) {
    return { allowed: false, reason: "scheduling requires an authorized awaiting-payment or payment-confirmed predecessor" };
  }

  const supplement = CANONICAL_SUPPLEMENT[f];
  if (supplement?.includes(t)) return { allowed: true };

  const lf = CANONICAL_TO_LEGACY[f];
  const lt = CANONICAL_TO_LEGACY[t];
  if (lf && lt) {
    return legacyCanTransition(lf, lt)
      ? { allowed: true }
      : { allowed: false, reason: `legacy machine disallows ${lf} → ${lt}` };
  }
  return { allowed: false, reason: `no canonical path ${f} → ${t}` };
}

export function getMatterStateLabel(state: string | null | undefined): string {
  return LABELS[normalizeMatterState(state)];
}

export function getMatterStateOperatorAction(state: string | null | undefined): string {
  return OPERATOR_ACTIONS[normalizeMatterState(state)];
}
