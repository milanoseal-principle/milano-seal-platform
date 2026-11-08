import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');
const hardening = read('supabase/migrations/20261108163500_p11_execution_qa_client_write_lockdown.sql');
const approval = read('app/api/dashboard/execution-qa/[matterId]/pass/route.ts');
const blocking = read('app/api/dashboard/execution-qa/[matterId]/block/route.ts');
const queue = read('app/api/dashboard/execution-qa/route.ts');
const review = read('app/api/dashboard/execution-qa/[matterId]/route.ts');

test('P11 authenticated browser roles cannot directly forge QA or witness completion', () => {
  for (const table of ['execution_qa_reviews', 'execution_qa_checklist_items']) {
    assert.match(hardening, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`));
    assert.match(hardening, new RegExp(`grant select, insert, update, delete on public\\.${table} to service_role`));
  }
  assert.match(hardening, /drop policy if exists "execution_qa_authenticated"/);
  assert.match(hardening, /drop policy if exists "qa_checklist_authenticated"/);
});

test('P11 QA routes use current authoritative role, not mutable profile data', () => {
  for (const source of [approval, blocking, queue, review]) {
    assert.match(source, /resolveServerRole\(user\)/);
    assert.doesNotMatch(source, /from\(["']profiles["']\)/);
  }
});

test('P11 QA writes cannot claim success after an unverified bulk update', () => {
  for (const source of [approval, blocking]) {
    assert.match(source, /\.eq\(["']id["'], review\.id\)/);
    assert.match(source, /STALE_QA_REVIEW/);
    assert.doesNotMatch(source, /\.update\([\s\S]*?\)\.eq\(["']deal_id["'], matterId\)/);
  }
  assert.match(queue, /QA_QUEUE_UNAVAILABLE/);
  assert.match(review, /QA_REVIEW_UNAVAILABLE/);
});
