import { test } from "node:test";
import assert from "node:assert/strict";
import { can, capabilitiesFor, PROTECTED_CAPABILITIES } from "@/lib/integration-command/rolePermissions";
import { canAssign, canPerform, canCoordinate, buildDedupKey, deduplicateTasks } from "@/lib/task-orchestration/taskPermissionEngine";
import type { SupportTask } from "@/lib/task-orchestration/types";

test("VA and Alliance can never confirm payment, unlock scheduling, authorize release, or mutate custody", () => {
  for (const role of ["virtual_assistant", "alliance_member"] as const) {
    assert.equal(can(role, "confirm_payment"), false);
    assert.equal(can(role, "unlock_scheduling"), false);
    assert.equal(can(role, "authorize_release"), false);
    assert.equal(can(role, "mutate_custody"), false);
    assert.equal(can(role, "mark_ron_complete"), false);
    assert.equal(can(role, "view_internal_margin"), false);
    assert.equal(can(role, "view_raw_provider_payload"), false);
  }
});

test("no non-founder/operator role holds a protected capability", () => {
  for (const role of ["alliance_member", "virtual_assistant"] as const) {
    const caps = capabilitiesFor(role);
    for (const p of PROTECTED_CAPABILITIES) assert.ok(!caps.includes(p), `${role} must not hold ${p}`);
  }
});

test("operator can assign; alliance cannot assign", () => {
  assert.equal(canAssign("operator", "virtual_assistant").allowed, true);
  assert.equal(canAssign("operator", "alliance_member").allowed, true);
  assert.equal(canAssign("alliance_member", "virtual_assistant").allowed, false);
});

test("VA↔Alliance coordination requires a shared matter", () => {
  assert.equal(canCoordinate({ role: "virtual_assistant", matterId: "m1" }, { role: "alliance_member", matterId: "m1" }).allowed, true);
  assert.equal(canCoordinate({ role: "virtual_assistant", matterId: "m1" }, { role: "alliance_member", matterId: "m2" }).allowed, false);
  assert.equal(canCoordinate({ role: "virtual_assistant", matterId: null }, { role: "alliance_member", matterId: null }).allowed, false);
});

test("VA can perform an assigned reminder task but not one requiring assignment authority", () => {
  const task: SupportTask = {
    id: "t1", matterId: "m1", sourceWorkspace: "operator", assignedRole: "virtual_assistant",
    assignedUserId: null, taskType: "prepare_payment_follow_up", title: "", status: "assigned",
    priority: "normal", requiredCapability: "prepare_reminder", sensitiveDataLevel: "standard",
    reviewerRole: "operator", dedupKey: buildDedupKey("m1", "prepare_payment_follow_up", "virtual_assistant"),
    createdAt: null, updatedAt: null,
  };
  assert.equal(canPerform("virtual_assistant", task).allowed, true);
  assert.equal(canPerform("alliance_member", task).allowed, false); // not assigned to alliance
});

test("duplicate open tasks are deduplicated by key", () => {
  const mk = (id: string): SupportTask => ({
    id, matterId: "m1", sourceWorkspace: "operator", assignedRole: "virtual_assistant",
    assignedUserId: null, taskType: "monitor_tracking", title: "", status: "open",
    priority: "normal", requiredCapability: "monitor_tracking", sensitiveDataLevel: "standard",
    reviewerRole: "operator", dedupKey: buildDedupKey("m1", "monitor_tracking", "virtual_assistant"),
    createdAt: null, updatedAt: null,
  });
  assert.equal(deduplicateTasks([mk("a"), mk("b")]).length, 1);
});
