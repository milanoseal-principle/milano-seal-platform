import type { VASafeMatter, VASafeTask } from "./vaTaskTypes";

// Raw db row → VASafeMatter. Only include fields from VASafeMatter type.
export function projectMatter(raw: Record<string, unknown>): VASafeMatter {
  return {
    id: String(raw.id ?? ""),
    display_id: String(raw.display_id ?? raw.deal_id ?? ""),
    client_display_name: String(raw.client_display_name ?? ""),
    destination_country: (raw.destination_country as string) ?? null,
    document_type: (raw.document_type as string) ?? null,
    client_safe_status: String(raw.client_safe_status ?? raw.deal_status ?? ""),
    next_step: (raw.next_step as string) ?? null,
    assigned_lane_name: (raw.assigned_lane_name as string) ?? null,
    due_at: (raw.due_at as string) ?? null,
    priority: (raw.priority as VASafeMatter["priority"]) ?? "NORMAL",
    missing_info_count: Number(raw.missing_info_count ?? 0),
    assigned_task_count: Number(raw.assigned_task_count ?? 0),
  };
}

// Raw db row → VASafeTask
export function projectTask(raw: Record<string, unknown>): VASafeTask {
  return {
    id: String(raw.id ?? ""),
    matter_id: (raw.matter_id as string) ?? null,
    matter_display_id: (raw.matter_display_id as string) ?? null,
    task_type: String(raw.task_type ?? ""),
    title: String(raw.title ?? raw.task_type ?? ""),
    description: String(raw.description ?? raw.notes_public ?? ""),
    status: ((raw.status as string) ?? "OPEN").toUpperCase() as VASafeTask["status"],
    priority: ((raw.priority ?? raw.urgency ?? "NORMAL") as string).toUpperCase() as VASafeTask["priority"],
    assigned_to: (raw.assigned_to as string) ?? null,
    due_at: (raw.due_at as string) ?? null,
    created_at: String(raw.created_at ?? ""),
    completed_at: (raw.completed_at as string) ?? null,
    client_safe_context: (raw.client_safe_context ?? raw.notes_public as string) ?? null,
    escalation_reason: (raw.escalation_reason as string) ?? null,
  };
}
