import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');
const migration = read('supabase/migrations/20261108163000_p4b_witness_qa_completion.sql');
const api = read('app/api/dashboard/execution-qa/[matterId]/witness-complete/route.ts');
const approval = read('app/api/dashboard/execution-qa/[matterId]/pass/route.ts');
const desk = read('components/execution-qa/ExecutionQADesk.tsx');
const retrievalGuard = read('lib/bluenotary/guards.ts');

test('P4B witness completion checks actual governed Matter and provider evidence', () => {
  assert.match(migration, /from public\.deals where id = p_matter/);
  assert.match(migration, /v_required <= 0/);
  assert.match(migration, /from public\.ron_sessions s where s\.id = p_session and s\.matter_id = p_matter/);
  assert.match(migration, /PROVIDER_SESSION_COMPLETED/);
  assert.match(migration, /w\.party_role = 'witness'/);
  assert.match(migration, /w\.witness_evidence_reference/);
  assert.match(migration, /w\.witness_appearance/);
  assert.match(migration, /v_verified < v_required/);
  assert.match(migration, /witness_status = 'COMPLETE'/);
});

test('P4B witness completion is atomic, idempotent and service-only', () => {
  assert.match(migration, /for update/);
  assert.match(migration, /if v_review\.witness_status = 'COMPLETE' then return v_review\.id/);
  assert.match(migration, /insert into public\.matter_evidence_ledger/);
  assert.match(migration, /'RON_WITNESS_QA_COMPLETED'/);
  assert.match(migration, /revoke all on function public\.complete_ron_witness_qa/);
  assert.match(migration, /from public, anon, authenticated/);
  assert.match(migration, /to service_role/);
  assert.match(api, /resolveServerRole\(user\)/);
  assert.match(api, /OPERATOR_ROLES\.has\(role\)/);
  assert.match(api, /\.rpc\('complete_ron_witness_qa'/);
  assert.doesNotMatch(api, /\.update\(\{\s*witness_status/);
});

test('P4B QA approval rejects incomplete witness evidence and stale updates', () => {
  assert.match(approval, /RON_WITNESS_QA_REQUIRED/);
  assert.match(approval, /review\.witness_status !== "COMPLETE"/);
  assert.match(approval, /QA_BLOCKERS_UNRESOLVED/);
  assert.match(approval, /\.eq\("id", review\.id\)\.eq\("execution_qa_status", review\.execution_qa_status\)/);
  assert.doesNotMatch(approval, /\.update\([\s\S]*?\)\.eq\("deal_id", matterId\)/);
});

test('P4B operator UI never displays fake QA success after failed request', () => {
  assert.match(desk, /if \(!response\.ok\)/);
  assert.match(desk, /Witness verification was not saved/);
  assert.match(desk, /role="alert"/);
  assert.match(desk, /Verify and complete witness QA/);
});

test('P4B executed document correction can be retrieved after evidence reopening', () => {
  assert.match(retrievalGuard, /const retrievable = \['PROVIDER_SESSION_COMPLETED', 'EVIDENCE_PENDING'\]/);
  assert.match(retrievalGuard, /retrievable\.includes\(session\.ron_lifecycle_state\)/);
  assert.doesNotMatch(retrievalGuard, /if \(session\.milano_ron_status === 'RON_REVIEW_REQUIRED'\)\s*throw/);
});
