import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const cron = readFileSync('app/api/cron/seo-search-console/route.ts', 'utf8');
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

test('Search Console cron requires bearer authorization and finalized window', () => {
  assert.ok(cron.includes('CRON_SECRET'));
  assert.ok(cron.includes("request.headers.get('authorization')"));
  assert.ok(cron.includes("triggerType: 'CRON'"));
  assert.ok(cron.includes('3 * 86400000'));
});

test('Search Console cron runs once daily at 06:00 UTC', () => {
  const entry = vercel.crons.find((item: { path: string }) => item.path === '/api/cron/seo-search-console');
  assert.deepEqual(entry, { path: '/api/cron/seo-search-console', schedule: '0 6 * * *' });
});
