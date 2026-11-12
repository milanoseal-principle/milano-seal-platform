export type QAEvent = typeof QA_EVENT_TYPES[number];

export const QA_EVENT_TYPES = [
  "EXECUTION_QA_STARTED",
  "SCANBACK_UPLOADED",
  "SCANBACK_REVIEW_STARTED",
  "SCANBACK_REVIEW_PASSED",
  "SCANBACK_REVIEW_FAILED",
  "EXECUTION_QA_REVIEW_REQUIRED",
  "EXECUTION_QA_BLOCKED",
  "EXECUTION_QA_PASSED",
  "WITNESS_NEEDED",
  "WITNESS_REQUESTED",
  "WITNESS_CONFIRMED",
  "BACKUP_NOTARY_NEEDED",
  "BACKUP_NOTARY_REQUESTED",
  "BACKUP_NOTARY_CONFIRMED",
  "QA_ESCALATED_TO_NICHOLAS",
] as const;

export async function logQAEvent(
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  params: { dealId: string; eventType: QAEvent; operatorId?: string; notes?: string }
): Promise<void> {
  try {
    // audit_events has no deal_id/notes columns: the Matter id is recorded in route (as the
    // canonical approve_document_version audit does) and details in metadata.
    await supabase.from("audit_events").insert({
      event_type: params.eventType,
      actor_id: params.operatorId ?? null,
      route: params.dealId,
      metadata: { deal_id: params.dealId, notes: params.notes ?? null },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking — audit log failure must not interrupt QA workflow
  }
}
