/**
 * taskPermissionEngine — decides whether a task may be created, assigned,
 * performed, or reviewed, using the canonical role permission matrix. VA↔Alliance
 * coordination is only allowed on a shared matter. Dedup prevents duplicate open
 * tasks for the same condition.
 */

import { can, type WorkspaceRole } from "@/lib/integration-command/rolePermissions";
import type { SupportTask } from "@/lib/task-orchestration/types";

export interface TaskDecision {
  allowed: boolean;
  reasons: string[];
}

/** Can `sourceRole` assign a task to `assignedRole`? */
export function canAssign(sourceRole: WorkspaceRole, assignedRole: WorkspaceRole): TaskDecision {
  const reasons: string[] = [];
  if (!can(sourceRole, "assign_task")) reasons.push(`${sourceRole} cannot assign tasks`);
  // Alliance members are never task assigners.
  if (assignedRole === "founder") reasons.push("tasks are not assigned down to founder");
  return { allowed: reasons.length === 0, reasons };
}

/** Can `role` perform the task's required capability? */
export function canPerform(role: WorkspaceRole, task: SupportTask): TaskDecision {
  const reasons: string[] = [];
  if (task.assignedRole !== role) reasons.push(`task is assigned to ${task.assignedRole}, not ${role}`);
  if (!can(role, task.requiredCapability)) reasons.push(`${role} lacks capability ${task.requiredCapability}`);
  if (task.sensitiveDataLevel === "founder_only" && role !== "founder") reasons.push("founder-only task");
  return { allowed: reasons.length === 0, reasons };
}

/**
 * VA↔Alliance coordination requires a shared matter, and the INITIATOR (a) must
 * hold the coordinate_alliance capability (Operator-routed). The counterpart need
 * not hold it — Alliance members are coordinated with, not coordinators. Never
 * permitted without a matter link.
 */
export function canCoordinate(
  a: { role: WorkspaceRole; matterId: string | null },
  b: { role: WorkspaceRole; matterId: string | null },
): TaskDecision {
  const reasons: string[] = [];
  if (!a.matterId || !b.matterId || a.matterId !== b.matterId) reasons.push("coordination requires a shared matter");
  if (!can(a.role, "coordinate_alliance")) reasons.push(`${a.role} lacks coordinate capability`);
  return { allowed: reasons.length === 0, reasons };
}

/** Deduplicate open tasks by dedupKey (matter + type + assigned role). */
export function buildDedupKey(matterId: string | null, taskType: string, assignedRole: WorkspaceRole): string {
  return `task:${matterId ?? "none"}:${taskType}:${assignedRole}`;
}

export function deduplicateTasks(tasks: SupportTask[]): SupportTask[] {
  const seen = new Set<string>();
  const out: SupportTask[] = [];
  for (const t of tasks) {
    if (t.status === "completed" || t.status === "cancelled") { out.push(t); continue; }
    if (seen.has(t.dedupKey)) continue;
    seen.add(t.dedupKey);
    out.push(t);
  }
  return out;
}
