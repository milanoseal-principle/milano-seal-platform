import { createAdminClient } from "@/lib/supabase/admin";
import type { EventType } from "@/src/features/milano/types";

export interface EventLedgerInput {
  matterId?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  eventType: EventType;
  statusBefore?: string | null;
  statusAfter?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function writeEventLedger(input: EventLedgerInput) {
  if (!input.matterId) return { skipped: true, reason: "missing_matter_id" };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_ledger")
    .insert({
      matter_id: input.matterId,
      actor_user_id: input.actorUserId ?? null,
      actor_email: input.actorEmail ?? null,
      event_type: input.eventType,
      status_before: input.statusBefore ?? null,
      status_after: input.statusAfter ?? null,
      message: input.message ?? input.eventType,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return { error };
  return { data };
}
