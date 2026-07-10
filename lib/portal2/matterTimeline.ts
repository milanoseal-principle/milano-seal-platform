// Client Portal 2.0 — pure timeline builder.

import type { MatterStatus, MatterTimelineEvent, PortalMatter } from "./types";
import { MATTER_STATUS_ORDER, MATTER_STATUS_LABELS } from "./types";

const STATUS_DESCRIPTIONS: Record<MatterStatus, string> = {
  intake_received: "Your matter has been received and secured for review.",
  under_review: "Your document path is being reviewed for execution readiness.",
  quoted: "Your execution proposal has been prepared.",
  awaiting_payment: "Payment is required before scheduling can begin.",
  scheduled: "Your execution session has been scheduled.",
  in_execution: "Your documents are being executed.",
  apostille_processing: "Your document is in apostille processing.",
  in_transit: "Your documents are in transit via courier.",
  delivered: "Your documents have been delivered.",
  completed: "Your matter is complete and all documents are released.",
};

/**
 * Build an ordered client-facing timeline from a matter.
 * Pure: derives every step from the canonical status order and the matter's
 * current status. Timestamps come only from timeline events already attached
 * to the matter (never fabricated).
 */
export function buildMatterTimeline(matter: PortalMatter): MatterTimelineEvent[] {
  const currentIndex = MATTER_STATUS_ORDER.indexOf(matter.status);

  // Index existing recorded timestamps by status for enrichment.
  const recordedByStatus = new Map<MatterStatus, string>();
  for (const ev of matter.timeline ?? []) {
    if (ev.timestamp && !recordedByStatus.has(ev.status)) {
      recordedByStatus.set(ev.status, ev.timestamp);
    }
  }

  return MATTER_STATUS_ORDER.map((status, idx) => {
    const state: MatterTimelineEvent["state"] =
      idx < currentIndex ? "complete" : idx === currentIndex ? "current" : "upcoming";

    return {
      id: `tl-${status}`,
      status,
      label: MATTER_STATUS_LABELS[status],
      description: STATUS_DESCRIPTIONS[status],
      timestamp: recordedByStatus.get(status) ?? null,
      state,
    };
  });
}
