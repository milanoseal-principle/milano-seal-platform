// Matter state safety — encodes the non-negotiable ordering rules as advisory
// guards. These DO NOT replace the real payment/release gates; they only let UI
// and validators detect an inconsistent state without touching protected logic.

import { normalizeMatterState, type CanonicalMatterState } from "./matterStateAdapters";

/** awaiting_payment must never present as scheduling-unlocked. */
export function schedulingConsistent(state: string, schedulingUnlocked: boolean): boolean {
  const s = normalizeMatterState(state);
  const preSchedule: CanonicalMatterState[] = [
    "intake_received", "under_review", "quote_ready", "quoted", "awaiting_payment",
  ];
  if (preSchedule.includes(s) && schedulingUnlocked) return false;
  return true;
}

/** Release-eligible must only be read from the approved gate, never inferred. */
export function releaseConsistent(state: string, releaseEligible: boolean | "unknown"): boolean {
  const s = normalizeMatterState(state);
  // Before delivery, release-eligible true is inconsistent.
  const preRelease: CanonicalMatterState[] = [
    "intake_received", "under_review", "quote_ready", "quoted", "awaiting_payment",
    "payment_confirmed", "scheduled", "in_execution",
  ];
  if (preRelease.includes(s) && releaseEligible === true) return false;
  return true;
}

/** Terminal states accept no further operational transitions. */
export function isTerminalMatterState(state: string): boolean {
  const s = normalizeMatterState(state);
  return s === "completed" || s === "cancelled";
}
