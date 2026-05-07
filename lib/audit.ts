import { createAdminClient } from "@/lib/supabase/admin";
import { emitEvent } from "@/lib/webhookBus";

export interface AuditEntry {
  event: string;
  actor?: string | null;
  resource?: string | null;
  payload?: Record<string, unknown> | null;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_logs").insert({
      actor: entry.actor ?? "system",
      event: entry.event,
      resource: entry.resource ?? null,
      payload: entry.payload ?? null,
    });
  } catch (err) {
    console.error(
      "[audit] insert failed:",
      err instanceof Error ? err.message : err,
    );
  }

  void emitEvent(entry.event, {
    actor: entry.actor ?? "system",
    resource: entry.resource ?? null,
    ...(entry.payload ?? {}),
  }).catch(() => {});
}
