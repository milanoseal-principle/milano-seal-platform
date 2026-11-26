// Discount request audit — writes to the canonical Matter timeline
// (public.matter_events, keyed on public.deals.id) through the existing
// writeMatterAuditEvent. It does not introduce a second audit system.
//
// discount_requests.matter_id is free text (it may hold a deals.id UUID or a
// human Matter reference such as MS-2026-0001), so the reference is resolved
// against an existing deals row before writing; nothing is ever translated
// blindly. An unresolved reference is not written and is reported as
// MATTER_IDENTITY_UNRESOLVED (logged and returned), never invented.

import { createAdminClient } from "@/lib/supabase/admin";
import { writeMatterAuditEvent } from "@/src/features/audit/eventLedgerService";
import type { EventType } from "@/src/features/milano/types";

export type DiscountAuditEvent =
  | "DISCOUNT_REQUEST_CREATED"
  | "DISCOUNT_REQUEST_APPROVED"
  | "DISCOUNT_REQUEST_DENIED";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The canonical deals.id for a Matter reference, or null when no deals row matches. */
export async function resolveCanonicalDealId(reference: string): Promise<string | null> {
  const ref = reference.trim();
  if (!ref) return null;
  const { data, error } = await createAdminClient()
    .from("deals")
    .select("id")
    .eq(UUID_RE.test(ref) ? "id" : "deal_id", ref)
    .maybeSingle();
  if (error) throw error;
  return (data as { id?: string } | null)?.id ?? null;
}

export async function recordDiscountAuditEvent(input: {
  eventType: DiscountAuditEvent;
  matterId?: string | null;
  actorEmail?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ data: { id: string } } | { skipped: true; reason: "no_matter" } | { error: string }> {
  // A request without a matter (e.g. a partner code request) is recorded in
  // discount_requests itself; there is no Matter timeline to write to.
  if (!input.matterId) return { skipped: true, reason: "no_matter" };

  let dealId: string | null;
  try {
    dealId = await resolveCanonicalDealId(input.matterId);
  } catch {
    console.error("[discount-audit] MATTER_IDENTITY_LOOKUP_FAILED", { eventType: input.eventType });
    return { error: "MATTER_IDENTITY_LOOKUP_FAILED" };
  }
  if (!dealId) {
    console.error("[discount-audit] MATTER_IDENTITY_UNRESOLVED", { eventType: input.eventType });
    return { error: "MATTER_IDENTITY_UNRESOLVED" };
  }

  const result = await writeMatterAuditEvent({
    matterId: dealId,
    actorEmail: input.actorEmail ?? null,
    eventType: input.eventType as EventType,
    message: input.message,
    metadata: { ...input.metadata, matter_reference: input.matterId },
  });
  if ("data" in result && result.data) return { data: result.data as { id: string } };
  console.error("[discount-audit] AUDIT_EVENT_NOT_PERSISTED", { eventType: input.eventType });
  return { error: "AUDIT_EVENT_NOT_PERSISTED" };
}
