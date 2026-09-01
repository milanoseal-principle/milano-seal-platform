import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveFreshnessState } from "../freshness-policy";
import { mapAllianceState } from "@/lib/alliance/quality-policy";

test("authority intelligence without provenance fails closed to REVIEW_REQUIRED", () => {
  assert.equal(
    deriveFreshnessState({ source_url: null, last_verified_at: null }),
    "REVIEW_REQUIRED",
  );
});

test("stale authority evidence is not treated as CURRENT", () => {
  const now = new Date("2026-09-01T12:00:00Z").getTime();
  const state = deriveFreshnessState(
    {
      source_url: "https://example.gov",
      last_verified_at: "2025-01-01T00:00:00Z",
      stale_after_days: 180,
      manual_review_required: false,
      routing_status: "ACTIVE",
    },
    now,
  );
  assert.equal(state, "STALE");
});

test("authority review flag overrides otherwise current dates", () => {
  const now = new Date("2026-09-01T12:00:00Z").getTime();
  assert.equal(
    deriveFreshnessState(
      {
        source_url: "https://example.gov",
        last_verified_at: "2026-08-31T00:00:00Z",
        stale_after_days: 180,
        manual_review_required: true,
        routing_status: "REVIEW_REQUIRED",
      },
      now,
    ),
    "REVIEW_REQUIRED",
  );
});

test("unknown Alliance status stays NEEDS_REVIEW", () => {
  assert.equal(mapAllianceState(undefined), "NEEDS_REVIEW");
  assert.equal(mapAllianceState("pending"), "NEEDS_REVIEW");
});

test("Alliance paused suspended and lost states remain distinct", () => {
  assert.equal(mapAllianceState("paused"), "PAUSED");
  assert.equal(mapAllianceState("suspended"), "SUSPENDED");
  assert.equal(mapAllianceState("terminated"), "LOST");
});
