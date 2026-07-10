// Legacy-shape adapters → canonical entities.
//
// Adapters translate ONLY. They never mutate protected systems and never invent
// facts; unknown source values become null/undefined on the canonical object.

import type { CanonicalMatterObject } from "../canonicalMatter";
import type { MatterCommandRecord } from "../../command-center/types";

/**
 * Adapt a legacy command-center MatterCommandRecord into a partial canonical
 * Matter. Only fields that map 1:1 are set; everything else stays undefined.
 * This is additive — it does not replace MatterCommandRecord for its consumers.
 */
export function matterCommandRecordToCanonical(
  rec: MatterCommandRecord,
): Partial<CanonicalMatterObject> {
  return {
    matterId: rec.dealId,
    matterType: rec.serviceType ?? "unknown",
    country: rec.country ?? undefined,
    referralSourceId: rec.referralSource ?? undefined,
    clientType: rec.clientType ?? undefined,
    documentIds: [],
    witnessIds: [],
    chainOfCustodyIds: [],
    knowledgeGraphNodeIds: [],
    kpiIds: [],
    status: rec.status ?? rec.masterStatus ?? "unknown",
    state: rec.status ?? undefined,
    quotedValue: rec.quotedPrice ?? null,
    paidValue: rec.amountPaid ?? null,
    paymentStatus: rec.paymentStatus ?? undefined,
    source: "command-center",
    sourceRecordId: rec.dealId,
    isSample: false,
  };
}
