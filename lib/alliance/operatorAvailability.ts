/**
 * Operator availability states and routing eligibility checks.
 * Availability is set by the operator and respected by the dispatch engine.
 */

export type OperatorAvailabilityState =
  | "AVAILABLE"
  | "BUSY"
  | "OFFLINE"
  | "AFTER_HOURS"
  | "RUSH_ONLY"
  | "TRAVELING"
  | "PAUSED"
  | "LOCKED";

/** States that allow the operator to receive standard routing assignments. */
const ROUTING_ELIGIBLE_STATES = new Set<OperatorAvailabilityState>([
  "AVAILABLE",
  "AFTER_HOURS",
  "RUSH_ONLY",
]);

/** States that allow rush-only assignments specifically. */
const RUSH_ELIGIBLE_STATES = new Set<OperatorAvailabilityState>([
  "AVAILABLE",
  "RUSH_ONLY",
]);

export function isRoutingEligible(
  availability: OperatorAvailabilityState,
): boolean {
  return ROUTING_ELIGIBLE_STATES.has(availability);
}

export function isRushEligible(
  availability: OperatorAvailabilityState,
): boolean {
  return RUSH_ELIGIBLE_STATES.has(availability);
}

export function availabilityLabel(state: OperatorAvailabilityState): string {
  const labels: Record<OperatorAvailabilityState, string> = {
    AVAILABLE: "Available",
    BUSY: "Busy",
    OFFLINE: "Offline",
    AFTER_HOURS: "After Hours",
    RUSH_ONLY: "Rush Only",
    TRAVELING: "Traveling",
    PAUSED: "Paused",
    LOCKED: "Locked",
  };
  return labels[state];
}

export function availabilityColor(
  state: OperatorAvailabilityState,
): "green" | "gold" | "gray" | "red" {
  if (state === "AVAILABLE") return "green";
  if (state === "AFTER_HOURS" || state === "RUSH_ONLY") return "gold";
  if (state === "LOCKED") return "red";
  return "gray";
}
