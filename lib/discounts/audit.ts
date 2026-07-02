// Discount audit helper — thin wrapper over the existing event ledger so every
// discount request/approval writes an audit row. Reuses writeEventLedger; does
// not introduce a second audit system.

import { writeEventLedger } from "@/src/features/audit/eventLedgerService";
import type { EventType } from "@/src/features/milano/types";

export type DiscountAuditEvent =
  | "DISCOUNT_REQUEST_CREATED"
  | "DISCOUNT_REQUEST_APPROVED"
  | "DISCOUNT_REQUEST_DENIED";

export async function recordDiscountAuditEvent(input: {
  eventType: DiscountAuditEvent;
  matterId?: string | null;
  actorEmail?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  // The ledger is keyed on matter_id; a request without a matter (e.g. a
  // partner code request) is still recorded in discount_requests itself, so we
  // simply skip the ledger write when no matter is attached.
  if (!input.matterId) return { skipped: true, reason: "no_matter" };
  return writeEventLedger({
    matterId: input.matterId,
    actorEmail: input.actorEmail ?? null,
    eventType: input.eventType as EventType,
    message: input.message,
    metadata: input.metadata,
  });
}
