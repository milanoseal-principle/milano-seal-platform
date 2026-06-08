export type TaskStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "ESCALATED" | "COMPLETE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type VASafeTask = {
  id: string;
  matter_id: string | null;
  matter_display_id: string | null;
  task_type: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  due_at: string | null;
  created_at: string;
  completed_at?: string | null;
  client_safe_context?: string | null;
  escalation_reason?: string | null;
};

export type VASafeMatter = {
  id: string;
  display_id: string;
  client_display_name: string;
  destination_country: string | null;
  document_type: string | null;
  client_safe_status: string;
  next_step: string | null;
  assigned_lane_name?: string | null;
  due_at?: string | null;
  priority?: TaskPriority;
  missing_info_count?: number;
  assigned_task_count?: number;
};

export type VAMessageDraft = {
  id: string;
  matter_id: string | null;
  draft_type: "client" | "partner";
  subject: string;
  body: string;
  status: "draft" | "review_required" | "approved" | "sent";
  created_at: string;
  updated_at: string;
};
