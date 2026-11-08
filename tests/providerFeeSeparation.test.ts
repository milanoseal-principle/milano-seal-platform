import assert from "node:assert/strict";
import test from "node:test";
import { calculatePrice } from "../lib/pricing";

test("P6 notarized signature count cannot change Milano price", () => {
  const baseline = calculatePrice({ tier: "signature", notarized_signature_count: 0 });
  const many = calculatePrice({ tier: "signature", notarized_signature_count: 25 });
  assert.equal(many.total, baseline.total);
  assert.equal(many.quoted_price, baseline.quoted_price);
  assert.equal(many.final_price, baseline.final_price);
  assert.equal(many.retainer, baseline.retainer);
});

test("P6 external provider evidence is not a Milano pricing input", () => {
  const baseline = calculatePrice({ tier: "priority" });
  const withProviderAliases = calculatePrice({
    tier: "priority",
    provider_fee_evidence_classification: "EXTERNAL_PROVIDER_NOTARIAL_FEE",
    provider_fee_evidence_reference: "provider-ref",
    ron_cost: 99999,
    bluenotary_fee: 99999,
  } as never);
  assert.equal(withProviderAliases.total, baseline.total);
  assert.equal(withProviderAliases.quoted_price, baseline.quoted_price);
});
