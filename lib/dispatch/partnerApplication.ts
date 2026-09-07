// Partner application read-model helpers.
// An application is a request to be considered — never a job offer, assignment,
// or guarantee. This module is pure/read-only and cannot assign work.

import type { DispatchPartner, DispatchStatus } from "./types";

export type PartnerApplication = DispatchPartner;
export type PartnerStatus = DispatchStatus;

export const APPLICATION_STATUS_ORDER: readonly PartnerStatus[] = [
  "application",
  "verification",
  "available",
  "assigned",
  "qa_review",
  "founder_approval",
  "complete",
];

/**
 * A current application is ready to enter operator verification only when the
 * record is still in the application stage and has explicit coverage evidence
 * plus a next action. The helper never changes status itself.
 */
export function isReadyForVerification(app: PartnerApplication): boolean {
  return (
    app.status === "application" &&
    Array.isArray(app.coverage) &&
    app.coverage.length > 0 &&
    typeof app.nextAction === "string" &&
    app.nextAction.trim().length > 0
  );
}

export function groupApplicationsByStatus(
  apps: readonly PartnerApplication[],
): Record<PartnerStatus, PartnerApplication[]> {
  const out: Record<PartnerStatus, PartnerApplication[]> = {
    application: [],
    verification: [],
    available: [],
    assigned: [],
    complete: [],
    qa_review: [],
    founder_approval: [],
  };

  for (const app of apps) out[app.status].push(app);
  return out;
}

export function pendingApplicationCount(apps: readonly PartnerApplication[]): number {
  return apps.filter(
    (app) => app.status === "application" || app.status === "verification",
  ).length;
}
