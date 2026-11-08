import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePortalLifecycleSummary, resolveStepIndex } from '@/components/portal/portal-status-rail';

for (const authentication of ['not_required', 'apostille', 'authentication_legalization', null]) {
  test(`canonical transit stays in delivery for authentication=${authentication}`, () => {
    const summary = resolvePortalLifecycleSummary('in_transit', 'paid', authentication);
    assert.equal(summary.currentStage, 'Delivery');
    assert.equal(summary.nextExpectedEvent, 'Delivery confirmation');
    assert.equal(summary.actionRequired, 'No client action is currently required.');
    assert.ok(resolveStepIndex('in_transit') > resolveStepIndex('in_execution'));
    assert.deepEqual(summary, resolvePortalLifecycleSummary('shipped', 'paid', authentication));
  });
}

test('transit does not represent delivery or close as complete', () => {
  assert.ok(resolveStepIndex('in_transit') < resolveStepIndex('completed'));
  assert.equal(resolvePortalLifecycleSummary('delivered', 'paid', 'not_required').nextExpectedEvent, 'Matter close');
});
