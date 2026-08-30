import test from 'node:test';
import assert from 'node:assert/strict';
import { certifyMatterLifecycle } from '@/lib/governance/matter-lifecycle-certification';

test('certifies only one continuous canonical Matter with complete evidence', () => {
  const matterId = 'matter-123';
  const result = certifyMatterLifecycle({
    matterId,
    canonicalStatus: 'completed',
    paymentConfirmed: true,
    paymentSettlementStatus: 'settled',
    executionTruth: { validation_complete: true, quote_approved: true, executed_at: '2026-08-30T00:00:00Z' },
    apostilleEvidence: true,
    custodyEvents: 4,
    courierReleasedAt: '2026-08-31T00:00:00Z',
    deliveredAt: '2026-09-02T00:00:00Z',
    closedAt: '2026-09-02T01:00:00Z',
    apiMatterId: matterId,
    portalMatterId: matterId,
    operatorMatterId: matterId,
    wiseMatterReference: matterId,
    eventMatterIds: [matterId],
    releaseMatterId: matterId,
    trackingMatterId: matterId,
  });
  assert.equal(result.identityContinuity, true);
  assert.equal(result.certified, true);
});

test('fails certification when any system points at a different Matter', () => {
  const result = certifyMatterLifecycle({ matterId: 'matter-123', apiMatterId: 'matter-999' });
  assert.equal(result.identityContinuity, false);
  assert.equal(result.certified, false);
  assert.match(result.conflicts[0] ?? '', /Matter identity conflict/);
});

test('never treats Wise processing as verified settlement', () => {
  const result = certifyMatterLifecycle({
    matterId: 'matter-123',
    paymentConfirmed: false,
    paymentSettlementStatus: 'observed_pending',
  });
  const payment = result.checkpoints.find((item) => item.checkpoint === 'WISE_PAYMENT_VERIFIED');
  assert.equal(payment?.state, 'UNVERIFIED');
});
