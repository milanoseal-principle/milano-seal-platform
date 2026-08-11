import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyAssetCategory,
  buildHighValueAssetMatter,
  detectReviewRequirements,
} from "@/lib/high-value-assets/assetClassifier";

test("vessel maps to vessel category and maritime-linked matter", () => {
  const m = buildHighValueAssetMatter({ text: "yacht purchase, bill of sale" });
  assert.equal(m.assetCategory, "vessel");
  assert.equal(m.maritimeLinked, true);
  assert.ok(m.documentFamilies.includes("bill-of-sale"));
});

test("preferred ship mortgage requires USCG/legal/title review", () => {
  const f = detectReviewRequirements({ text: "preferred ship mortgage for vessel" });
  assert.equal(f.requiresUSCGReview, true);
  assert.equal(f.requiresLegalReview, true);
  assert.equal(f.requiresTitleReview, true);
});

test("aircraft bill of sale requires FAA/specialist review", () => {
  const m = buildHighValueAssetMatter({ text: "aircraft bill of sale" });
  assert.equal(m.assetCategory, "aircraft");
  assert.equal(m.safetyFlags.requiresFAAReview, true);
  assert.equal(m.reviewRequired, true);
});

test("exotic vehicle title transfer requires title/legal review", () => {
  const m = buildHighValueAssetMatter({ text: "exotic ferrari title transfer" });
  assert.equal(m.assetCategory, "exotic-vehicle");
  assert.equal(m.safetyFlags.requiresTitleReview, true);
  assert.equal(m.safetyFlags.requiresLegalReview, true);
});

test("art/provenance docs require specialist review", () => {
  const f = detectReviewRequirements({ text: "art provenance document" });
  assert.equal(f.requiresSpecialistReview, true);
});

test("apostille package detects international handling", () => {
  const m = buildHighValueAssetMatter({ text: "apostille package for corporate resolution" });
  assert.equal(m.international, true);
  assert.ok(m.documentFamilies.includes("apostille-package"));
});

test("unknown category defaults to review-required", () => {
  const c = classifyAssetCategory({ text: "something unspecified" });
  assert.equal(c, "unknown");
  const m = buildHighValueAssetMatter({ text: "something unspecified" });
  assert.equal(m.reviewRequired, true);
});
