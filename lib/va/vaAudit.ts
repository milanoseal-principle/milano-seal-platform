import { createAdminClient } from "@/lib/supabase/admin";

export async function logVAAction(params: {
  userId: string;
  action: string;
  taskId?: string;
  matterId?: string;
  note?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_events").insert({
      actor_id: params.userId,
      event_type: `va.${params.action}`,
      // audit_events has no resource columns; keep them in metadata (NOT NULL).
      route: params.matterId ?? null,
      metadata: {
        resource_type: params.taskId ? "va_task" : "va_session",
        resource_id: params.taskId ?? params.matterId ?? null,
        ...(params.note ? { note: params.note } : {}),
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit failures must never block VA actions
  }
}
