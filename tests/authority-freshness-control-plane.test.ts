import assert from "node:assert/strict"; import test from "node:test"; import { deriveAuthorityFreshness } from "@/lib/authorities/freshness";
test("missing evidence is unverified and review-required", () => assert.deepEqual(deriveAuthorityFreshness({}, new Date("2026-01-01")), { status: "UNVERIFIED", routeReviewRequired: true, reason: "Current receiving-authority requirements require confirmation before execution." }));
test("source conflict never produces READY", () => assert.equal(deriveAuthorityFreshness({ sourceConflict: true }).routeReviewRequired, true));
