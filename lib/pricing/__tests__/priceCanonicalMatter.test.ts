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

test("field-equal execution Matters priced by different surfaces match exactly", () => {
  const matter = {
    executionTier: "Priority",
    destinationCountry: "Italy",
    apostilleStatus: "required",
    ron: true,
  } as const;
  const intakeView = priceCanonicalMatter(matter);
  const portalView = priceCanonicalMatter(matter);

test("field-equal Matters priced by 'different surfaces' match on lane/add-ons/total/review", () => {
  // An established execution service (ron) plus a required apostille prices to a
  // full, approved lane total. A lane preference alone is deliberately NOT
  // treated as evidence of execution (see milanoPricingTruth), so ron establishes
  // the execution service here.
  const matter = { executionTier: "Priority" as const, destinationCountry: "Italy", apostilleStatus: "required", ron: true };
  const intakeView = priceCanonicalMatter(matter);
  const portalView = priceCanonicalMatter({ ...matter });
  assert.equal(intakeView.suggestedLane, portalView.suggestedLane);
  assert.deepEqual(intakeView.authorizedAddOns, portalView.authorizedAddOns);
  assert.equal(intakeView.total, portalView.total);
  assert.equal(intakeView.manualReviewRequired, portalView.manualReviewRequired);
  assert.equal(intakeView.total, 1250); // Priority 975 + first apostille 250 + notarized signature 25
});

test("executionTier selects the lane only when execution is independently established", () => {
  assert.equal(
    priceCanonicalMatter({ executionTier: "Executive", ron: true }).suggestedLane,
    "executive",
  );
});

test("executionTier alone never fabricates an execution service", () => {
  const r = priceCanonicalMatter({ executionTier: "Executive" });
  assert.equal(r.suggestedLane, "regulated_manual_review");
  assert.equal(r.total, null);
  assert.equal(r.manualReviewRequired, true);
  assert.equal(intakeView.suggestedLane, "priority");
  assert.equal(intakeView.total, 1250); // 1000 Priority base + 250 apostille, consistent across surfaces
});

test("lane maps from executionTier", () => {
  // ron establishes the execution service so the priced lane is reached; without
  // an execution service the matter routes to review rather than a fabricated lane.
  assert.equal(priceCanonicalMatter({ executionTier: "Executive", ron: true }).suggestedLane, "executive");
});

test("government contract Matter → government_quote, never consumer lane", () => {
  const r = priceCanonicalMatter({
    executionTier: "Priority",
    governmentContractId: "GOV-123",
    destinationCountry: "Italy",
    apostilleStatus: "required",
  });
  assert.equal(r.suggestedLane, "government_quote");
  assert.equal(r.total, null);
});

test("already-completed apostille is never re-priced", () => {
  const r = priceCanonicalMatter({
    executionTier: "Signature",
    destinationCountry: "Italy",
    apostilleStatus: "completed",
    ron: true,
  });
  assert.notEqual(r.authorizedAddOns.apostille, 250);
});

test("payment gate + scheduling lock preserved on the canonical result", () => {
  const r = priceCanonicalMatter({ executionTier: "Signature", ron: true });
  assert.equal(r.paymentGateRequired, true);
  assert.equal(r.schedulingLockedUntilPayment, true);
});
