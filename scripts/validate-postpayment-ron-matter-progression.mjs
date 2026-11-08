import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

const migration = read('supabase/migrations/089_verified_settlement_scheduling_gate.sql');
const schedule = read('app/api/deals/[id]/schedule/route.ts');
const guards = read('lib/bluenotary/guards.ts');
const sessions = read('app/api/dashboard/ron/sessions/route.ts');
const webhook = read('app/api/webhooks/bluenotary/route.ts');
const advance = read('app/api/dashboard/ron/sessions/[id]/advance-to-apostille/route.ts');
const apostille = read('app/api/deals/[id]/apostille/route.ts');
const portal = read('app/portal/ron/page.tsx');
const control = read('components/ron/RONSessionControlPanel.tsx');
const release = read('lib/release/performFinalRelease.ts');

assert.match(migration, /NEW\.payment_confirmed is true/);
assert.match(migration, /NEW\.payment_settlement_status = 'cleared'/);
assert.match(migration, /round\(NEW\.amount_paid \* 100\) = round\(NEW\.amount_due \* 100\)/);
assert.match(migration, /scheduling requires payment_confirmed/);
assert.match(migration, /verified Wise settlement required/);
assert.doesNotMatch(migration, /payment_observed_at is not null/i);

assert.match(schedule, /evaluateSchedulingGate/);
assert.match(guards, /assertCanCreateRONSession/);
assert.match(guards, /assertCanReleaseSigningURL/);
assert.match(guards, /assertCanAdvanceToApostille/);
assert.match(sessions, /assertCanCreateRONSession/);

assert.match(webhook, /session_started/);
assert.match(webhook, /MATTER_EXECUTION_STARTED_FROM_RON/);
assert.match(webhook, /status:\s*'in_execution'/);
assert.match(webhook, /milano_ron_status:\s*'SESSION_PROCESSING'/);
assert.match(webhook, /provider_completion_is_authoritative:\s*false/);
assert.doesNotMatch(webhook, /milano_ron_status:\s*'RON_COMPLETED'/);
assert.doesNotMatch(webhook, /status:\s*'apostille_processing'/);
assert.doesNotMatch(webhook, /performFinalRelease/);

assert.match(advance, /assertCanAdvanceToApostille/);
assert.match(advance, /status:\s*'apostille_processing'/);
assert.match(advance, /deal_status:\s*'apostille_processing'/);
assert.match(advance, /READY_FOR_APOSTILLE/);
assert.match(advance, /RON_APOSTILLE_QA_APPROVED/);

assert.match(apostille, /USE_GOVERNED_RON_APOSTILLE_QA/);
assert.match(apostille, /status:\s*409/);
assert.doesNotMatch(apostille, /\.update\(/);
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
