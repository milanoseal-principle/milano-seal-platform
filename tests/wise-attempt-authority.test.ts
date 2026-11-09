import test from 'node:test';
import assert from 'node:assert/strict';
import { hasCurrentWiseProviderEvidence, activityMatchesAttempt, isInvalidWiseStatus } from '@/lib/wise/attemptEvidence';
import { evaluateExecutionGate, evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

const matter = {
  id: 'matter-a', deal_id: 'MS-A', wise_reference: 'MS-A', currency: 'USD', amount_due: 100, amount_paid: 0,
  payment_status: 'unpaid', payment_confirmed: false, payment_settlement_status: 'observed_pending',
  payment_observed_at: '2026-11-09T00:01:00Z', payment_observed_amount: 100,
  payment_observed_currency: 'USD', payment_observed_reference: 'MS-A',
  payment_attempt_id: 'attempt-a', payment_attempt_started_at: '2026-11-09T00:00:00Z',
  wise_transaction_reference: 'provider-a', payment_funding_method: 'wise_acquiring_payment',
  wise_provider_evidence: {
    matter_id: 'matter-a', attempt_id: 'attempt-a', resource_id: 'provider-a', status: 'IN_PROGRESS',
    occurred_at: '2026-11-09T00:00:30Z', amount: 100, currency: 'USD', reference: 'MS-A',
  },
};

test('current provider attempt permits execution but never creates settlement', () => {
  assert.equal(hasCurrentWiseProviderEvidence(matter), true);
  assert.equal(evaluateExecutionGate(matter).schedulingEligible, true);
  assert.equal(matter.payment_confirmed, false);
});

test('client resubmission cannot revive a cancelled/failed/expired/reversed attempt', () => {
  for (const status of ['CANCELLED','FAILED','EXPIRED','REVERSED','VOIDED','REFUNDED','REJECTED','REVOKED','SUPERSEDED']) {
    assert.equal(isInvalidWiseStatus(status), true);
    const invalid = { ...matter, wise_provider_evidence: { ...matter.wise_provider_evidence, status } };
    assert.equal(evaluateExecutionGate(invalid).schedulingEligible, false, status);
    assert.equal(evaluateExecutionGate({ ...invalid, payment_attempt_id: 'new-attempt' }).schedulingEligible, false, status);
  }
  assert.equal(evaluateSchedulingGate({ matter: { ...matter, wise_provider_evidence: null } }).schedulingEligible, true);
});

test('missing, stale, unknown and mismatched evidence fails closed', () => {
  for (const change of [
    { attempt_id: 'old-attempt' }, { matter_id: 'foreign-matter' }, { resource_id: 'foreign-resource' },
    { amount: 99 }, { amount: NaN }, { currency: 'EUR' }, { reference: 'MS-FOREIGN' },
    { status: 'UNKNOWN' }, { status: 'REQUIRES_ATTENTION' }, { occurred_at: '2026-11-08T00:00:00Z' },
    { occurred_at: 'invalid' },
  ]) assert.equal(hasCurrentWiseProviderEvidence({ ...matter, wise_provider_evidence: { ...matter.wise_provider_evidence, ...change } }), false, JSON.stringify(change));
  for (const change of [{ payment_attempt_id: null }, { payment_attempt_started_at: null }, { wise_provider_evidence: null }, { payment_funding_method: 'wise' }]) {
    assert.equal(evaluateExecutionGate({ ...matter, ...change }).schedulingEligible, false);
  }
});

test('activity enrichment requires current creation time and explicit matching amount/currency', () => {
  const activity = { createdOn: '2026-11-09T00:00:15Z', resource: { amount: { value: 100, currency: 'USD' } } };
  assert.equal(activityMatchesAttempt(activity, matter), true);
  for (const a of [
    { ...activity, createdOn: '2026-11-08T23:59:59Z' }, { ...activity, createdOn: undefined },
    { ...activity, resource: { amount: { value: 99, currency: 'USD' } } },
    { ...activity, resource: { amount: { value: 100, currency: 'EUR' } } },
    { createdOn: activity.createdOn, primaryAmount: '$100' },
  ]) assert.equal(activityMatchesAttempt(a, matter), false);
});
