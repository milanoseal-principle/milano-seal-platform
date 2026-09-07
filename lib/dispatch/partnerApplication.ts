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

export function isReadyForVerification(app: PartnerApplication): boolean {
  return (
    app.status === "applied" &&
    app.acknowledgedIndependence &&
    app.capabilities.length > 0
  );
}

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
  for (const app of apps) out[app.status].push(app);
  return out;
}

export function pendingApplicationCount(apps: PartnerApplication[]): number {
  return apps.filter((app) => app.status === "applied" || app.status === "verifying")
    .length;
}
