import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePrice } from '../lib/pricing';

// BlueNotary controls and collects notarial/provider fees separately.
// Signature count and provider fee evidence must not enter Milano financial truth.
test('P6: notarized-signature count does not change Milano quote totals', () => {
  const baseline = calculatePrice({ tier: 'signature', document_count: 2, signer_count: 2, notarized_signature_count: 0 });
  for (const count of [1, 2, 7, 25]) {
    const result = calculatePrice({ tier: 'signature', document_count: 2, signer_count: 2, notarized_signature_count: count });
    assert.equal(result.total, baseline.total);
    assert.equal(result.quoted_price, baseline.quoted_price);
    assert.equal(result.final_price, baseline.final_price);
    assert.equal(result.retainer, baseline.retainer);
    assert.deepEqual(result.breakdown, baseline.breakdown);
    assert.equal(result.internal.notarized_signature_count, count);
  }
});

test('P6: externally supplied provider-fee amounts cannot alter Milano price', () => {
  const base = calculatePrice({ tier: 'priority', document_count: 1 });
  for (const value of [0, 25, 2500, 999999]) {
    // Untrusted provider fields can arrive from integrations or client requests.
    const input = { tier: 'priority', document_count: 1, provider_fee_amount: value,
      bluenotary_fee: value, ron_cost: value, notarized_signature_fee: value,
      provider_fee_evidence_classification: 'EXTERNAL_PROVIDER_NOTARIAL_FEE' };
    const result = calculatePrice(input);
    assert.equal(result.total, base.total);
    assert.equal(result.quoted_price, base.quoted_price);
    assert.deepEqual(result.breakdown, base.breakdown);
  }
});
