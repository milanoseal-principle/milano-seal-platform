import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

const migration = read('supabase/migrations/079_wise_observed_scheduling_gate.sql');
const schedule = read('app/api/deals/[id]/schedule/route.ts');
const guards = read('lib/bluenotary/guards.ts');
const sessions = read('app/api/dashboard/ron/sessions/route.ts');
const webhook = read('app/api/webhooks/bluenotary/route.ts');
const advance = read('app/api/dashboard/ron/sessions/[id]/advance-to-apostille/route.ts');
const apostille = read('app/api/deals/[id]/apostille/route.ts');
const portal = read('app/portal/ron/page.tsx');
const control = read('components/ron/RONSessionControlPanel.tsx');
const release = read('lib/release/performFinalRelease.ts');

assert.match(migration, /NEW\.status = 'scheduled'/);
assert.match(migration, /payment_observed_at is not null/i);
assert.match(migration, /observed_pending/);
assert.match(migration, /payment_observed_amount/);
assert.match(migration, /payment_observed_currency/);
assert.match(migration, /payment_observed_reference/);
assert.doesNotMatch(migration, /payment_status\s*=\s*'paid'[\s\S]*payment_observed_at/i);

assert.match(schedule, /evaluateSchedulingGate/);
assert.match(guards, /assertCanCreateRONSession/);
assert.match(guards, /assertCanReleaseSigningURL/);
assert.match(guards, /assertCanAdvanceToApostille/);
assert.match(sessions, /assertCanCreateRONSession/);

assert.match(webhook, /session_started/);
assert.match(webhook, /MATTER_EXECUTION_STARTED_FROM_RON/);
assert.match(webhook, /status:\s*'in_execution'/);
assert.match(webhook, /SIGNED_DOCS_RETRIEVED/);
assert.doesNotMatch(webhook, /status:\s*'apostille_processing'/);
assert.doesNotMatch(webhook, /performFinalRelease/);

assert.match(advance, /assertCanAdvanceToApostille/);
assert.match(advance, /status:\s*'apostille_processing'/);
assert.match(advance, /deal_status:\s*'apostille_processing'/);
assert.match(advance, /READY_FOR_APOSTILLE/);
assert.match(advance, /RON_APOSTILLE_QA_APPROVED/);

assert.match(apostille, /status:\s*"apostille_processing"/);
assert.doesNotMatch(apostille, /status:\s*"apostille"/);
assert.doesNotMatch(apostille, /requirePaid/);

assert.match(control, /Approve Apostille QA & Advance Matter/);
assert.match(control, /advance-to-apostille/);
assert.match(portal, /SIGNED_DOCS_RETRIEVED/);
assert.match(portal, /READY_FOR_APOSTILLE/);
assert.match(portal, /"apostille"/);

assert.match(release, /payment/i, 'Final release must retain its separate payment controls');

const activeFiles = [migration, schedule, guards, sessions, webhook, advance, apostille, portal, control, release].join('\n');
assert.doesNotMatch(activeFiles, /stripe/i, 'Postpayment RON corridor must remain Wise-only');

console.log('Postpayment RON Matter progression contract validated.');
