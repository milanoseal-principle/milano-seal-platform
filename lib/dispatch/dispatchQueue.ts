// Dispatch queue read-model helpers.
// Pure/read-only: no automatic assignment, no guaranteed partner routing, and no
// Matter/payment/release mutation occurs here.

import type { DispatchPartner, DispatchStatus } from "./types";

export type DispatchQueueItem = DispatchPartner;

const STATUS_WEIGHT: Record<DispatchStatus, number> = {
  application: 0,
  verification: 1,
  available: 2,
  assigned: 3,
  qa_review: 4,
  founder_approval: 5,
  complete: 6,
};

/**
 * Return non-complete dispatch records in deterministic operational order.
 * This is display ordering only; it does not assign work or change state.
 */
export function prioritizeQueue(
  items: readonly DispatchQueueItem[],
): DispatchQueueItem[] {
  return [...items]
    .filter((item) => item.status !== "complete")
    .sort((a, b) => {
      const statusDelta = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
      if (statusDelta !== 0) return statusDelta;
      return a.name.localeCompare(b.name);
    });
}

export function countByStatus(
  items: readonly DispatchQueueItem[],
): Record<DispatchStatus, number> {
  const out: Record<DispatchStatus, number> = {
    application: 0,
    verification: 0,
    available: 0,
    assigned: 0,
    complete: 0,
    qa_review: 0,
    founder_approval: 0,
  };

  for (const item of items) out[item.status] += 1;
  return out;
}

export function openJobCount(items: readonly DispatchQueueItem[]): number {
  return items.filter((item) => item.status !== "complete").length;
}
