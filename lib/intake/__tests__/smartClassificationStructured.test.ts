import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntake } from "../smartClassification";

test("structured already-completed notarization overrides conflicting text", () => {
  const result = classifyIntake({
    text: "I need a notarization",
    structured: { notarization: "already_completed" },
  });
  assert.equal(result.notarization, "already_completed");
});

test("structured negative notarization overrides conflicting text", () => {
  const result = classifyIntake({
    text: "I need a notarization",
    structured: { notarization: false },
  });
  assert.equal(result.notarization, "not_required");
});
