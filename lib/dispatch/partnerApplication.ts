// Partner application intake model + helpers.
// An application is a request to be considered — never a job offer and never
// an implied assignment. Partners are independent contractors.

import type { PartnerApplication, PartnerStatus } from "./types";

export const APPLICATION_STATUS_ORDER: PartnerStatus[] = [
  "applied",
  "verifying",
  "vetted",
  "active",
  "inactive",
  "blocked",
];

// Whether an application is ready to advance into verification.
export function isReadyForVerification(app: PartnerApplication): boolean {
  return (
    app.status === "applied" &&
    app.acknowledgedIndependence &&
    app.capabilities.length > 0
  );
}

// Group applications by status for the intake queue.
export function groupApplicationsByStatus(
  apps: PartnerApplication[],
): Record<PartnerStatus, PartnerApplication[]> {
  const out = {
    applied: [],
    verifying: [],
    vetted: [],
    active: [],
    inactive: [],
    blocked: [],
  } as Record<PartnerStatus, PartnerApplication[]>;
  for (const a of apps) out[a.status].push(a);
  return out;
}

// Count of applications still awaiting an operator decision.
export function pendingApplicationCount(apps: PartnerApplication[]): number {
  return apps.filter((a) => a.status === "applied" || a.status === "verifying")
    .length;
}
