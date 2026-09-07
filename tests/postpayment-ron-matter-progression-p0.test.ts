import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');

test('observed Wise submission can enter scheduling without authoring paid state', () => {
  const migration = read('supabase/migrations/079_wise_observed_scheduling_gate.sql');
  assert.match(migration, /NEW\.status = 'scheduled'/);
  assert.match(migration, /observed_pending/);
  assert.match(migration, /payment_observed_at is not null/i);
  assert.match(migration, /payment_observed_amount/);
  assert.match(migration, /payment_observed_currency/);
  assert.match(migration, /payment_observed_reference/);
});

test('BlueNotary provider start advances the same Matter into execution only', () => {
  const webhook = read('app/api/webhooks/bluenotary/route.ts');
  assert.match(webhook, /session_started/);
  assert.match(webhook, /status:\s*'in_execution'/);
  assert.match(webhook, /deal_status:\s*'in_execution'/);
  assert.match(webhook, /MATTER_EXECUTION_STARTED_FROM_RON/);
  assert.doesNotMatch(webhook, /status:\s*'apostille_processing'/);
});

test('signed documents require explicit operator Apostille QA advancement', () => {
  const route = read('app/api/dashboard/ron/sessions/[id]/advance-to-apostille/route.ts');
  const control = read('components/ron/RONSessionControlPanel.tsx');
  assert.match(route, /assertCanAdvanceToApostille/);
  assert.match(route, /apostille_processing/);
  assert.match(route, /READY_FOR_APOSTILLE/);
  assert.match(route, /RON_APOSTILLE_QA_APPROVED/);
  assert.match(control, /Approve Apostille QA & Advance Matter/);
});

test('client progress projects Apostille only after signed-document truth', () => {
  const portal = read('app/portal/ron/page.tsx');
  assert.match(portal, /SIGNED_DOCS_RETRIEVED/);
  assert.match(portal, /READY_FOR_APOSTILLE/);
  assert.match(portal, /progressStage/);
});

test('legacy apostille route writes canonical state and no old paid helper', () => {
  const route = read('app/api/deals/[id]/apostille/route.ts');
  assert.match(route, /status:\s*"apostille_processing"/);
  assert.match(route, /deal_status:\s*"apostille_processing"/);
  assert.doesNotMatch(route, /requirePaid/);
  assert.doesNotMatch(route, /status:\s*"apostille"/);
});
