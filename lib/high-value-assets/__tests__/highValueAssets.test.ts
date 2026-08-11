import { test } from "node:test";
import assert from "node:assert/strict";
import { getAssetDocument, ASSET_DOCUMENT_REGISTRY } from "@/lib/high-value-assets/documentRegistry";
import { scoreHighValueAssetUrgency } from "@/lib/high-value-assets/urgency";
import { shouldUseMaritimeWorkflow, mergeMaritimeTrustChainEvents } from "@/lib/high-value-assets/maritimeBridge";
import { buildHighValueAssetPricingContext } from "@/lib/high-value-assets/pricingAdapter";
import { validateHighValueAssetOutput, validateHighValueAssetMatter } from "@/lib/high-value-assets/safetyGuard";
import { buildHighValueAssetMatter } from "@/lib/high-value-assets/assetClassifier";

test("document registry descriptions avoid guarantees", () => {
  for (const d of ASSET_DOCUMENT_REGISTRY) {
    assert.equal(/guarantee/i.test(d.clientSafeDescription), false);
  }
  assert.ok(getAssetDocument("title-transfer")?.reviewRequired);
});

test("urgency engine honors payment-before-scheduling and never guarantees", () => {
  const r = scoreHighValueAssetUrgency({ hoursRemaining: 4, paymentConfirmed: false });
  assert.equal(r.operatorNextAction, "verify_payment");
  assert.equal(r.guaranteed, false);
});

test("vessel matter bridges into maritime; events dedup", () => {
  const m = buildHighValueAssetMatter({ text: "yacht preferred ship mortgage" });
  assert.equal(shouldUseMaritimeWorkflow(m), true);
  const merged = mergeMaritimeTrustChainEvents(m, ["matter_created", "matter_created", "payment_confirmed"]);
  assert.deepEqual(merged, ["matter_created", "payment_confirmed"]);
});

test("pricing adapter delegates to canonical gateway (manual quote, internal)", () => {
  const m = buildHighValueAssetMatter({ text: "aircraft bill of sale international" });
  const ctx = buildHighValueAssetPricingContext(m);
  assert.equal(ctx.requiresManualQuote, true);
  assert.equal(ctx.canonicalPricingContext.internalOnly, true);
  assert.equal(ctx.canonicalPricingContext.consumer, undefined);
});

test("safety guard blocks approval/guarantee claims", () => {
  assert.equal(validateHighValueAssetOutput("We guarantee title transfer").ok, false);
  assert.equal(validateHighValueAssetOutput("we clear customs for you").ok, false);
  assert.equal(validateHighValueAssetOutput("Document execution support, review-dependent").ok, true);
});

test("matter validation requires the no-guarantee flag", () => {
  const m = buildHighValueAssetMatter({ text: "vessel bill of sale" });
  assert.equal(validateHighValueAssetMatter(m).ok, true);
  m.safetyFlags.cannotGuaranteeOutcome = false;
  assert.equal(validateHighValueAssetMatter(m).ok, false);
});
