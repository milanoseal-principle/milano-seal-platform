import { test } from "node:test";
import assert from "node:assert/strict";
import { priceCanonicalMatter } from "../priceCanonicalMatter";
import type { CanonicalMatterObject } from "../../platform/canonicalMatter";

const M = (o: Partial<CanonicalMatterObject>): Partial<CanonicalMatterObject> => o;

// Cross-surface invariant: the SAME Matter → the SAME result, no matter which
// surface computed it (they all call priceCanonicalMatter).
test("same canonical Matter produces an identical pricing result (determinism)", () => {
  const m = M({ executionTier: "Signature", destinationCountry: "Italy", apostilleStatus: "required" });
  const a = priceCanonicalMatter(m);
  const b = priceCanonicalMatter({ ...m });
  assert.deepEqual(a, b);
});

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
  assert.equal(intakeView.suggestedLane, "priority");
  assert.equal(intakeView.total, 1250); // 1000 Priority base + 250 apostille, consistent across surfaces
});

test("lane maps from executionTier", () => {
  // ron establishes the execution service so the priced lane is reached; without
  // an execution service the matter routes to review rather than a fabricated lane.
  assert.equal(priceCanonicalMatter({ executionTier: "Executive", ron: true }).suggestedLane, "executive");
});

test("government contract Matter → government_quote, never consumer lane", () => {
  const r = priceCanonicalMatter({ executionTier: "Priority", governmentContractId: "GOV-123", destinationCountry: "Italy", apostilleStatus: "required" });
  assert.equal(r.suggestedLane, "government_quote");
  assert.equal(r.total, null);
});

test("already-completed apostille is never re-priced", () => {
  const r = priceCanonicalMatter({ executionTier: "Signature", destinationCountry: "Italy", apostilleStatus: "completed" });
  // apostille already_completed → not an add-on; a signature execution matter still prices its lane.
  assert.notEqual(r.authorizedAddOns.apostille, 250);
});

test("payment gate + scheduling lock preserved on the canonical result", () => {
  const r = priceCanonicalMatter({ executionTier: "Signature" });
  assert.equal(r.paymentGateRequired, true);
  assert.equal(r.schedulingLockedUntilPayment, true);
});
