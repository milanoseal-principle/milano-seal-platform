import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync("supabase/migrations/066_review_request_events.sql", "utf8");
const transition = fs.readFileSync("app/api/review-requests/[id]/transition/route.ts", "utf8");

test("review events are append-only and status-triggered", () => {
  for (const invariant of ["review_request_events", "before update or delete", "REVIEW_REQUESTED", "REVIEW_ACKNOWLEDGED", "REVIEW_STARTED", "REVIEW_RESOLVED", "REVIEW_CLOSED"]) assert.ok(migration.includes(invariant));
});

test("operator transitions use optimistic concurrency and never mutate Matter state", () => {
  assert.ok(transition.includes('.eq("status", from)'));
  assert.equal(transition.includes('.from("deals").update'), false);
  assert.ok(transition.includes("INVALID_REVIEW_TRANSITION"));
});
