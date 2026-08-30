import test from "node:test";
import assert from "node:assert/strict";
import { reconcileAuthorityFreshness } from "@/lib/authorities/reconcileFreshness";

const now = new Date("2026-08-30T12:00:00Z");

test("keeps current verified authority active", () => {
  const result = reconcileAuthorityFreshness(
    {
      id: "a1",
      source_url: "https://example.gov/authority",
      last_verified_at: "2026-08-01T12:00:00Z",
      stale_after_days: 180,
      confidence_level: "VERIFIED_OFFICIAL",
      routing_status: "ACTIVE",
      manual_review_required: false,
    },
    now,
  );

  assert.equal(result.desiredRoutingStatus, "ACTIVE");
  assert.equal(result.manualReviewRequired, false);
  assert.equal(result.stale, false);
});

test("fails closed when authority provenance is missing", () => {
  const result = reconcileAuthorityFreshness(
    {
      id: "a2",
      source_url: null,
      last_verified_at: "2026-08-01T12:00:00Z",
      stale_after_days: 180,
      confidence_level: "VERIFIED_OFFICIAL",
    },
    now,
  );

  assert.equal(result.desiredRoutingStatus, "REVIEW_REQUIRED");
  assert.equal(result.manualReviewRequired, true);
});

test("fails closed when authority verification is stale", () => {
  const result = reconcileAuthorityFreshness(
    {
      id: "a3",
      source_url: "https://example.gov/authority",
      last_verified_at: "2025-01-01T00:00:00Z",
      stale_after_days: 180,
      confidence_level: "VERIFIED_OFFICIAL",
    },
    now,
  );

  assert.equal(result.desiredRoutingStatus, "REVIEW_REQUIRED");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.stale, true);
});

test("flags review due soon without prematurely deactivating valid routing", () => {
  const result = reconcileAuthorityFreshness(
    {
      id: "a4",
      source_url: "https://example.gov/authority",
      last_verified_at: "2026-03-25T12:00:00Z",
      stale_after_days: 180,
      confidence_level: "VERIFIED_OPERATOR",
    },
    now,
  );

  assert.equal(result.desiredRoutingStatus, "ACTIVE");
  assert.equal(result.reviewDueSoon, true);
  assert.equal(result.manualReviewRequired, false);
});

test("never activates client-provided or unverified authority claims", () => {
  for (const confidence of ["CLIENT_PROVIDED", "UNVERIFIED_REVIEW_REQUIRED"]) {
    const result = reconcileAuthorityFreshness(
      {
        id: confidence,
        source_url: "https://example.com/unverified",
        last_verified_at: "2026-08-20T12:00:00Z",
        stale_after_days: 180,
        confidence_level: confidence,
      },
      now,
    );

    assert.equal(result.desiredRoutingStatus, "REVIEW_REQUIRED");
    assert.equal(result.manualReviewRequired, true);
  }
});
