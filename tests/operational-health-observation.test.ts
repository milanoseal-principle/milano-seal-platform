import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOperationalHealth } from '@/lib/operator-intelligence/read-model';
import type { createAdminClient } from '@/lib/supabase/admin';
function adminFor(results: Record<string, unknown>, queried: string[] = []) {
  return { from(table: string) {
    queried.push(table);
    const builder = { select() { return builder; }, limit() { return builder; }, eq() { return builder; }, in() { return builder; }, not() { return builder; },
      then(resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) { return Promise.resolve(results[table] ?? { error: null, count: 0, data: [] }).then(resolve, reject); } };
    return builder;
  } } as unknown as ReturnType<typeof createAdminClient>;
}
test('monitoring separates observed database reads, queue counts and provider health', async () => {
  const rows = await loadOperationalHealth('admin_operator', adminFor({ wise_reconciliation_exceptions: { error: null, count: 3 }, retention_records: { error: null, count: 1 } }));
  assert.equal(rows.find(r => r.id === 'database')?.state, 'Operational');
  assert.equal(rows.find(r => r.id === 'wise')?.state, 'Degraded');
  assert.match(rows.find(r => r.id === 'wise')!.note, /3 recorded items/);
  assert.match(rows.find(r => r.id === 'wise')!.note, /NOT VERIFIED/);
  assert.equal(rows.find(r => r.id === 'notifications')?.state, 'Unknown');
  assert.equal(rows.find(r => r.id === 'retention')?.state, 'Degraded');
});
test('failed and missing counts never become zero or healthy and raw errors are not exposed', async () => {
  const rows = await loadOperationalHealth('admin_operator', adminFor({ notifications: { error: { message: 'private-token-and-client-data' }, count: 0 }, ron_sessions: { error: null, count: null } }));
  for (const id of ['notifications','ron']) {
    const row = rows.find(r => r.id === id)!;
    assert.equal(row.state, 'Unknown'); assert.equal(row.observedAt, null); assert.match(row.note, /NOT VERIFIED/);
  }
  assert.doesNotMatch(JSON.stringify(rows), /private-token-and-client-data/);
});
test('operator health does not query corporate tasks outside the governance role scope', async () => {
  const queried: string[] = [];
  const rows = await loadOperationalHealth('execution_coordinator', adminFor({}, queried));
  assert.equal(queried.includes('governance_tasks'), false);
  assert.equal(rows.find(r => r.id === 'governance')?.state, 'Unknown');
});

import { paymentObservationPresentation } from '@/lib/wise/attemptEvidence';
test('cancelled invoice observation is not perpetual processing and missing state is unverified', () => {
  const submission = { paymentConfirmed: false, settlementStatus: 'observed_pending', paymentObservedAt: '2026-11-09T00:00:00Z' };
  assert.equal(paymentObservationPresentation(submission), 'pending');
  assert.equal(paymentObservationPresentation({ ...submission, submissionCurrent: false }), 'not_submitted');
  assert.equal(paymentObservationPresentation({ ...submission, settlementStatus: 'observed_available', submissionCurrent: false }), 'pending');
  for (const settlementStatus of ['failed','cancelled','expired','reversed','refunded']) assert.equal(paymentObservationPresentation({ ...submission, settlementStatus }), 'invalidated');
  assert.equal(paymentObservationPresentation(null), 'unverified');
  assert.equal(paymentObservationPresentation({ ...submission, settlementStatus: 'mismatch_review' }), 'review');
  assert.equal(paymentObservationPresentation({ ...submission, settlementStatus: 'cleared', paymentConfirmed: true }), 'settled');
});
