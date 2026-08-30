import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const route = readFileSync('app/api/review-requests/[id]/link-matter/route.ts', 'utf8');

test('operator linking never creates or transitions a Matter', () => {
  assert.ok(route.includes('requireDashboardAccess'));
  assert.ok(route.includes('REVIEW_MATTER_LINKED'));
  assert.ok(route.includes('matter_lifecycle_changed: false'));
  assert.doesNotMatch(route, /\.from\(['"]deals['"]\)\.insert|MATTER_STATES|transitionMatter|payment_confirmed|scheduled_at/);
});
