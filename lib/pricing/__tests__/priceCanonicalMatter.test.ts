import { test } from "node:test";
import assert from "node:assert/strict";
import { priceCanonicalMatter } from "../priceCanonicalMatter";
import type { CanonicalMatterObject } from "../../platform/canonicalMatter";

const M = (o: Partial<CanonicalMatterObject>): Partial<CanonicalMatterObject> => o;

test("same canonical Matter produces an identical pricing result (determinism)", () => {
  const m = M({
    executionTier: "Signature",
    destinationCountry: "Italy",
    apostilleStatus: "required",
    ron: true,
  });
  const a = priceCanonicalMatter(m);
  const b = priceCanonicalMatter({ ...m });
  assert.deepEqual(a, b);
});

test("field-equal Matters priced by different surfaces match on lane/add-ons/total/review", () => {
  const matter = {
    executionTier: "Priority" as const,
    destinationCountry: "Italy",
    apostilleStatus: "required" as const,
    ron: true,
  };

  const intakeView = priceCanonicalMatter(matter);
  const portalView = priceCanonicalMatter({ ...matter });

  assert.equal(intakeView.suggestedLane, portalView.suggestedLane);
  assert.deepEqual(intakeView.authorizedAddOns, portalView.authorizedAddOns);
  assert.equal(intakeView.total, portalView.total);
  assert.equal(intakeView.manualReviewRequired, portalView.manualReviewRequired);
  assert.equal(intakeView.suggestedLane, "priority");
  assert.equal(intakeView.total, 1000); // 975 Priority, first apostille included, + 25 tracking
});

test("executionTier selects the lane only when execution is independently established", () => {
  assert.equal(
    priceCanonicalMatter({ executionTier: "Executive", ron: true }).suggestedLane,
    "executive",
  );
});

test("executionTier alone never fabricates an execution service", () => {
  const result = priceCanonicalMatter({ executionTier: "Executive" });
  assert.equal(result.suggestedLane, "regulated_manual_review");
  assert.equal(result.total, null);
  assert.equal(result.manualReviewRequired, true);
});

test("government contract Matter routes to government_quote, never a consumer lane", () => {
  const result = priceCanonicalMatter({
    executionTier: "Priority",
    governmentContractId: "GOV-123",
    destinationCountry: "Italy",
    apostilleStatus: "required",
  });
  assert.equal(result.suggestedLane, "government_quote");
  assert.equal(result.total, null);
});

test("already-completed apostille is never re-priced", () => {
  const result = priceCanonicalMatter({
    executionTier: "Signature",
    destinationCountry: "Italy",
    apostilleStatus: "completed",
    ron: true,
  });
  assert.notEqual(result.authorizedAddOns.apostille, 250);
});

test("payment gate and scheduling lock are preserved on canonical pricing", () => {
  const result = priceCanonicalMatter({ executionTier: "Signature", ron: true });
  assert.equal(result.paymentGateRequired, true);
  assert.equal(result.schedulingLockedUntilPayment, true);
});
