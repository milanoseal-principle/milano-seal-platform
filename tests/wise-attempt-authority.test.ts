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

test('current provider attempt remains evidence, never execution or settlement authority', () => {
  assert.equal(hasCurrentWiseProviderEvidence(matter), true);
  assert.equal(evaluateExecutionGate(matter).schedulingEligible, false);
  assert.equal(matter.payment_confirmed, false);
});

test('client resubmission cannot revive a cancelled/failed/expired/reversed attempt', () => {
  for (const status of ['CANCELLED','FAILED','EXPIRED','REVERSED','VOIDED','REFUNDED','REJECTED','REVOKED','SUPERSEDED']) {
    assert.equal(isInvalidWiseStatus(status), true);
    const invalid = { ...matter, wise_provider_evidence: { ...matter.wise_provider_evidence, status } };
    assert.equal(evaluateExecutionGate(invalid).schedulingEligible, false, status);
    assert.equal(evaluateExecutionGate({ ...invalid, payment_attempt_id: 'new-attempt' }).schedulingEligible, false, status);
  }
  assert.equal(evaluateSchedulingGate({ matter: { ...matter, wise_provider_evidence: null } }).schedulingEligible, false);
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

import { portalRONProjection, isRonSigningSessionActive } from '@/lib/bluenotary/projection';
import type { RONSession, RONSigner } from '@/lib/bluenotary/types';
const activeSession = { id: 'session-a', milano_ron_status: 'SIGNER_INVITED', ron_lifecycle_state: 'REQUESTED', expired_at: null, payment_gate_status: 'UNLOCKED' } as RONSession;
const releasedSigner = { email: 'owner@example.invalid', signing_url_released: true, signing_url_encrypted: 'https://provider.example.invalid/sign/synthetic' } as RONSigner;

test('cached released signer URL requires current execution authority on every read', () => {
  assert.equal(portalRONProjection(activeSession, [releasedSigner], releasedSigner.email!).signing_url, null);
  const schedulingOnly = { schedulingAuthorized: true, executionAuthorized: false };
  assert.equal(portalRONProjection(activeSession, [releasedSigner], releasedSigner.email!, schedulingOnly).signing_url, null);
  const currentAuthority = { schedulingAuthorized: true, executionAuthorized: true };
  assert.equal(portalRONProjection(activeSession, [releasedSigner], releasedSigner.email!, currentAuthority).signing_url, releasedSigner.signing_url_encrypted);
  assert.equal(portalRONProjection(activeSession, [releasedSigner], 'foreign@example.invalid', currentAuthority).signing_url, null);
  for (const change of [
    { ron_lifecycle_state: 'FAILED' }, { ron_lifecycle_state: 'CANCELLED' }, { ron_lifecycle_state: 'COMPLETED' },
    { ron_lifecycle_state: 'PROVIDER_SESSION_COMPLETED' }, { ron_lifecycle_state: undefined },
    { expired_at: '2020-01-01T00:00:00Z' }, { expired_at: 'malformed' }, { milano_ron_status: 'RON_EXPIRED' },
  ]) {
    const session = { ...activeSession, ...change } as RONSession;
    assert.equal(isRonSigningSessionActive(session), false);
    assert.equal(portalRONProjection(session, [releasedSigner], releasedSigner.email!, currentAuthority).signing_url, null);
  }
});
