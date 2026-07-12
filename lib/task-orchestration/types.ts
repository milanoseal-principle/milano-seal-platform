/**
 * Task Orchestration — the permission-aware layer that connects the four
 * workspaces (Founder, Operator, Alliance, VA) through canonical support tasks
 * on a shared Matter. It creates NO payment/courier/RON/Matter records; it only
 * routes reviewable work with explicit permission + audit.
 */

import type { WorkspaceRole } from "@/lib/integration-command/rolePermissions";

export type SupportTaskStatus =
  | "open" | "assigned" | "in_progress" | "blocked" | "awaiting_review" | "completed" | "cancelled";

export type SupportTaskType =
  | "verify_client_contact"
  | "request_missing_document"
  | "confirm_signer_availability"
  | "confirm_witness_availability"
  | "prepare_payment_follow_up"
  | "verify_payment_status"
  | "prepare_ron_session"
  | "confirm_ron_participant"
  | "prepare_courier_details"
  | "verify_shipping_address"
  | "monitor_tracking"
  | "upload_tracking_evidence"
  | "coordinate_alliance_member"
  | "request_alliance_update"
  | "prepare_operator_summary"
  | "escalate_integration_issue"
  | "prepare_founder_brief"
  | "close_completed_task";

export interface SupportTask {
  id: string;
  matterId: string | null;
  sourceWorkspace: WorkspaceRole;
  assignedRole: WorkspaceRole;
  assignedUserId: string | null;
  taskType: SupportTaskType;
  title: string;
  status: SupportTaskStatus;
  priority: "low" | "normal" | "high" | "urgent";
  requiredCapability:
    | "prepare_reminder" | "monitor_tracking" | "attach_permitted_evidence"
    | "coordinate_alliance" | "assign_task" | "review_task_completion" | "escalate_to_founder";
  sensitiveDataLevel: "standard" | "restricted" | "founder_only";
  reviewerRole: WorkspaceRole | null;
  dedupKey: string;
  createdAt: string | null;
  updatedAt: string | null;
}
