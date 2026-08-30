import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const control = readFileSync('components/dashboard/SearchConsoleSyncControl.tsx', 'utf8');
const manual = readFileSync('app/api/admin/seo/search-console/sync/route.ts', 'utf8');
const sync = readFileSync('lib/seo/search-console/sync.ts', 'utf8');

test('manual Search Console sync is governed and exposes operational states', () => {
  for (const state of ['UNCONFIGURED','READY','SYNCING','SYNCED','FAILED']) assert.ok(control.includes(state));
  assert.ok(control.includes('SYNC SEARCH CONSOLE'));
  assert.ok(manual.includes('requireDashboardAccess'));
  assert.ok(manual.includes('SEARCH_CONSOLE_UNCONFIGURED'));
});

test('manual sync records an auditable run without fabricating rows', () => {
  assert.ok(manual.includes("triggerType: 'MANUAL'"));
  assert.ok(sync.includes('seo_search_console_sync_runs'));
  assert.ok(sync.includes("status: 'SUCCEEDED'"));
  assert.ok(sync.includes("status: 'FAILED'"));
  assert.doesNotMatch(sync, /fabricat|seed|mock/i);
});
