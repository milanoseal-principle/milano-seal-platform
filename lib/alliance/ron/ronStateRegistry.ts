import type { RonStateRegistryEntry } from "./types";

const PRIORITY_STATES = [
  ["FL", "Florida"],
  ["TX", "Texas"],
  ["CA", "California"],
  ["NY", "New York"],
  ["NJ", "New Jersey"],
  ["PA", "Pennsylvania"],
  ["IL", "Illinois"],
  ["VA", "Virginia"],
  ["CO", "Colorado"],
  ["AZ", "Arizona"],
  ["NV", "Nevada"],
  ["GA", "Georgia"],
  ["NC", "North Carolina"],
  ["OH", "Ohio"],
  ["MI", "Michigan"],
  ["WA", "Washington"],
  ["OR", "Oregon"],
  ["UT", "Utah"],
  ["TN", "Tennessee"],
  ["IN", "Indiana"],
] as const;

/**
 * Recruitment priority only. This registry deliberately makes no legal claim
 * that RON is currently available in any listed state. Operational activation
 * requires a dated official source review and partner-level credential review.
 */
export const RON_STATE_REGISTRY: RonStateRegistryEntry[] = PRIORITY_STATES.map(
  ([code, state], index) => ({
    code,
    state,
    priority: index + 1,
    coverageStatus: "REVIEW_REQUIRED",
    lastVerifiedAt: null,
    sourceUrl: null,
    notes: "Verify current state RON authority, registration requirements, platform rules, and execution constraints before dispatch.",
  }),
);

export function getRonStateEntry(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return (
    RON_STATE_REGISTRY.find(
      (entry) =>
        entry.code.toLowerCase() === normalized ||
        entry.state.toLowerCase() === normalized,
    ) ?? null
  );
}
