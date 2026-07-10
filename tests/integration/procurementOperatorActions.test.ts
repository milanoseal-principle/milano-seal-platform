import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deduplicateActions,
  type ProcurementOperatorAction,
} from "@/lib/procurement/procurementOperatorActions";

function action(
  actionType: ProcurementOperatorAction["actionType"],
  sourceSubmissionId: string | null,
  id: string,
): ProcurementOperatorAction {
  return {
    id, actionType, title: actionType, description: "", priority: "NORMAL",
    status: "open", owner: null, dueAt: null, blocker: null, sourceSubmissionId,
    route: "/dashboard/government",
  };
}

test("duplicate equivalent procurement actions are removed", () => {
  const deduped = deduplicateActions([
    action("review_opportunity", "s1", "a"),
    action("review_opportunity", "s1", "b"), // duplicate of a
    action("review_opportunity", "s2", "c"), // different submission — kept
    action("prepare_pricing", "s1", "d"),
  ]);
  assert.equal(deduped.length, 3);
  assert.deepEqual(deduped.map((a) => a.id), ["a", "c", "d"]);
});
