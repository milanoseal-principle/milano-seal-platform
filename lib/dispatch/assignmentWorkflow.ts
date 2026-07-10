// Assignment state machine + helpers.
// CRITICAL: an assignment is always an OFFER first. A partner may accept or
// decline. Nothing here forces a partner to take work or guarantees them work.

import type { Assignment, AssignmentState } from "./types";

// Legal transitions from each state.
const TRANSITIONS: Record<AssignmentState, AssignmentState[]> = {
  offered: ["accepted", "declined", "expired", "withdrawn"],
  accepted: ["completed", "withdrawn"],
  declined: [],
  expired: [],
  withdrawn: [],
  completed: [],
};

export function canTransition(
  from: AssignmentState,
  to: AssignmentState,
): boolean {
  return TRANSITIONS[from].includes(to);
}

// Apply a transition, returning a new Assignment. Throws on illegal moves so
// callers never silently "guarantee" an assignment by skipping the offer step.
export function applyTransition(
  assignment: Assignment,
  to: AssignmentState,
  at: string,
): Assignment {
  if (!canTransition(assignment.state, to)) {
    throw new Error(
      `Illegal assignment transition: ${assignment.state} -> ${to}`,
    );
  }
  return { ...assignment, state: to, respondedAt: at };
}

// An offer expires if unanswered past its expiry.
export function isExpired(assignment: Assignment, now: string): boolean {
  return (
    assignment.state === "offered" &&
    new Date(now).getTime() > new Date(assignment.expiresAt).getTime()
  );
}

export function isActive(assignment: Assignment): boolean {
  return assignment.state === "offered" || assignment.state === "accepted";
}
