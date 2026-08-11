import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIntakeAnalyticsPayload, INTAKE_ANALYTICS_EVENTS } from "../intakeAnalytics";

test("analytics registry contains the required Smart Intake lifecycle", () => {
  for (const event of [
    "intake_started",
    "description_completed",
    "clarification_requested",
    "review_viewed",
    "intake_submitted",
    "upload_failed",
    "upload_retry_started",
    "upload_retry_completed",
  ]) {
    assert.ok(INTAKE_ANALYTICS_EVENTS.includes(event as never));
  }
});

test("analytics payload strips raw client/document/private data", () => {
  const payload = buildIntakeAnalyticsPayload("intake_error", {
    step: 2,
    questionCount: 3,
    rawDescription: "private legal narrative",
    documentText: "private document body",
    ssn: "111-22-3333",
    token: "secret-token",
  });
  assert.deepEqual(payload.metadata, { step: 2, questionCount: 3 });
  const json = JSON.stringify(payload);
  assert.ok(!json.includes("private legal narrative"));
  assert.ok(!json.includes("111-22-3333"));
  assert.ok(!json.includes("secret-token"));
});
