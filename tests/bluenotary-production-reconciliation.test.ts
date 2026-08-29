import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guards = readFileSync('lib/bluenotary/guards.ts', 'utf8');
const sessions = readFileSync('app/api/dashboard/ron/sessions/route.ts', 'utf8');
const documents = readFileSync('app/api/dashboard/ron/sessions/[id]/documents/route.ts', 'utf8');
const controls = readFileSync('components/ron/RONSessionControlPanel.tsx', 'utf8');
const readiness = readFileSync('components/ron/MatterRONReadiness.tsx', 'utf8');
const queue = readFileSync('app/dashboard/ron/page.tsx', 'utf8');
const detail = readFileSync('app/dashboard/ron/[session_id]/page.tsx', 'utf8');
const migration = readFileSync('supabase/migrations/062_bluenotary_ron_production_reconciliation.sql', 'utf8');
const storageMigration = readFileSync('supabase/migrations/063_ron_document_storage_bucket.sql', 'utf8');

test('BlueNotary uses the canonical payment confirmation authority', () => {
  assert.match(guards, /evaluatePaymentIntegrity/);
  assert.match(guards, /payment_confirmed/);
  assert.match(guards, /schedulingAllowed/);
  assert.match(guards, /PAYMENT_NOT_CONFIRMED/);
  assert.doesNotMatch(guards, /payment_status !== 'paid'/);
});

test('Wise processing never unlocks RON scheduling', () => {
  assert.match(readiness, /Retainer submitted · Wise processing/);
  assert.match(readiness, /payment_confirmed === true/);
  assert.match(queue, /Retainer submitted · Wise processing/);
  assert.match(queue, /payment_confirmed=true/);
});

test('BlueNotary session creation fails closed on incomplete RON truth', () => {
  assert.match(guards, /execution_method !== 'ron'/);
  assert.match(guards, /NOTARIAL_ACT_REVIEW_REQUIRED/);
  assert.match(guards, /RON_JURISDICTION_INCOMPLETE/);
  assert.match(guards, /Signer name, email, and phone are required/);
});

test('same Matter signer state and document package are seeded into the existing RON module', () => {
  assert.match(sessions, /execution_truth/);
  assert.match(sessions, /signer_location/);
  assert.match(sessions, /state: s\.state/);
  assert.match(sessions, /from\('files'\)/);
  assert.match(sessions, /from\('ron_documents'\)\.insert/);
  assert.match(sessions, /storage_bucket: 'deal-documents'/);
});

test('RON document transfer reads the canonical private Matter bucket', () => {
  assert.match(documents, /storage_bucket/);
  assert.match(documents, /deal-documents/);
  assert.match(documents, /payment_gate_status !== 'UNLOCKED'/);
  assert.match(storageMigration, /storage_bucket text not null default 'deal-documents'/);
});

test('operator surfaces expose pre-session readiness and real handoff controls', () => {
  assert.match(queue, /RON Matters · Before BlueNotary Session/);
  assert.match(readiness, /Signer Phone/);
  assert.match(readiness, /Notarization Type/);
  assert.match(readiness, /Destination Jurisdiction/);
  assert.match(readiness, /BlueNotary Operator Actions/);
  assert.match(controls, /Create BlueNotary RON Session/);
  assert.match(controls, /JSON\.stringify\(body\)/);
  assert.match(controls, /Upload Matter Package/);
  assert.match(detail, /signer\.phone/);
  assert.match(detail, /signer\.state/);
});

test('production reconciliation creates one canonical RON schema with current app_metadata RLS', () => {
  for (const table of ['ron_sessions', 'ron_signers', 'ron_documents', 'ron_webhook_events', 'ron_audit_events']) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(migration, /app_metadata/);
  assert.match(migration, /service_role/);
  assert.doesNotMatch(migration, /va_assignments/);
});
