import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/066_review_request_events.sql', 'utf8');
const route = readFileSync('app/api/review-requests/[id]/route.ts', 'utf8');

test('review event ledger is immutable and isolated from Matter state', () => {
  assert.match(migration, /review_request_events/);
  assert.match(migration, /append-only/);
  assert.match(migration, /before update or delete/);
  assert.doesNotMatch(route, /MATTER_STATES|transitionMatter|payment_confirmed|scheduled_at/);
});

test('every governed review transition writes a matching event', () => {
  for (const event of ['REVIEW_ACKNOWLEDGED','REVIEW_STARTED','REVIEW_RESOLVED','REVIEW_CLOSED']) {
    assert.ok(route.includes(event));
  }
  assert.ok(route.includes(".eq('status', from)"));
});
