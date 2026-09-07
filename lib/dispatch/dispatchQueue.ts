// Dispatch queue model + helpers.
// The queue holds jobs awaiting an OFFER to independent partners. Nothing here
// assigns work automatically or guarantees any partner an assignment.

import type { DispatchJob, DispatchJobStatus, DispatchPriority } from "./types";

const PRIORITY_WEIGHT: Record<DispatchPriority, number> = {
  urgent: 0,
  priority: 1,
  standard: 2,
};

export function prioritizeQueue(jobs: DispatchJob[]): DispatchJob[] {
  return [...jobs]
    .filter((job) => job.status === "queued" || job.status === "offered")
    .sort((a, b) => {
      const priorityDelta = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(a.requestedFor).getTime() - new Date(b.requestedFor).getTime();
    });
}

export function countByStatus(
  jobs: DispatchJob[],
): Record<DispatchJobStatus, number> {
  const out = {
    queued: 0,
    offered: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  } as Record<DispatchJobStatus, number>;
  for (const job of jobs) out[job.status] += 1;
  return out;
}

export function openJobCount(jobs: DispatchJob[]): number {
  return jobs.filter((job) => job.status === "queued" || job.status === "offered").length;
}
