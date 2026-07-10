// Helpers to flag intakes that have stalled, based on last-activity age.
// Pure functions — the caller supplies "now" or relies on the default clock.

import type { AbandonedIntake, AcquisitionFunnelStage } from "./types";

// An intake is considered stalled once activity is older than this threshold,
// unless it already reached a terminal-for-acquisition stage.
export const DEFAULT_STALL_HOURS = 24;

const TERMINAL_STAGES: AcquisitionFunnelStage[] = ["payment_confirmed"];

export function hoursSince(iso: string, now: number = Date.now()): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (now - t) / 3_600_000);
}

/**
 * True when an intake has stalled: not terminal and inactive beyond threshold.
 */
export function isStalled(
  intake: AbandonedIntake,
  stallHours: number = DEFAULT_STALL_HOURS,
  now: number = Date.now(),
): boolean {
  if (TERMINAL_STAGES.includes(intake.stage)) return false;
  return hoursSince(intake.lastActivityAt, now) >= stallHours;
}

/**
 * Return only the stalled intakes, most-stale first. Pure.
 */
export function flagAbandoned(
  intakes: AbandonedIntake[],
  stallHours: number = DEFAULT_STALL_HOURS,
  now: number = Date.now(),
): AbandonedIntake[] {
  return intakes
    .filter((i) => isStalled(i, stallHours, now))
    .sort(
      (a, b) =>
        hoursSince(b.lastActivityAt, now) - hoursSince(a.lastActivityAt, now),
    );
}
