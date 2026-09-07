import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/079_wise_observed_scheduling_gate.sql");
const webhook = read("app/api/webhooks/bluenotary/route.ts");
const guards = read("lib/bluenotary/guards.ts");
const qa = read("app/api/dashboard/ron/sessions/[id]/apostille-qa/route.ts");
const legacy = read("app/api/deals/[id]/apostille/route.ts");
const release = read("lib/release/performFinalRelease.ts");

assert.match(migration, /entering_scheduled[\s\S]*observed_wise/);
assert.match(migration, /wise_provider_evidence[\s\S]*advancing_after_scheduling/);
assert.match(migration, /payment_confirmed = false[\s\S]*payment_status[\s\S]*<> 'paid'/);
assert.match(webhook, /eventInsertError\?\.code === '23505'/);
assert.match(webhook, /event_type === 'session_started'[\s\S]*status: 'in_execution'/);
assert.match(webhook, /\.eq\('status', 'scheduled'\)/);
assert.match(webhook, /execution_at: now[\s\S]*executed_at: now/);
assert.match(webhook, /SIGNED_DOCS_RETRIEVED/);
assert.doesNotMatch(webhook, /status:\s*'apostille_processing'/);
assert.match(guards, /WISE_PROVIDER_EVIDENCE_REQUIRED/);
assert.match(guards, /NO_SIGNED_DOCUMENTS/);
assert.match(qa, /assertCanAdvanceToApostille/);
assert.match(qa, /status: 'apostille_processing'[\s\S]*deal_status: 'apostille_processing'/);
assert.match(qa, /RON_APOSTILLE_QA_APPROVED/);
assert.match(legacy, /USE_GOVERNED_APOSTILLE_TRANSITION/);
assert.match(release, /payment_settlement_status/);

console.log("PASS post-payment Wise/RON/Apostille corridor invariants");
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const migration = read('supabase/migrations/079_wise_observed_scheduling_gate.sql');
const guards = read('lib/bluenotary/guards.ts');
const webhook = read('app/api/webhooks/bluenotary/route.ts');
const apostilleQa = read('app/api/dashboard/ron/sessions/[id]/apostille-qa/route.ts');
const legacyApostille = read('app/api/deals/[id]/apostille/route.ts');
const adminStatus = read('app/api/admin/matters/[id]/status/route.ts');
const signedDocs = read('app/api/dashboard/ron/sessions/[id]/signed-documents/route.ts');
const finalRelease = read('lib/release/performFinalRelease.ts');

// Scheduling authority is observation-based but non-paid.
assert.match(migration, /NEW\.status\s*=\s*'scheduled'/);
assert.match(migration, /observed_submission_valid/);
assert.match(migration, /payment_observed_at/);
assert.match(migration, /payment_observed_amount/);
assert.match(migration, /payment_observed_currency/);
assert.match(migration, /payment_observed_reference/);
assert.doesNotMatch(migration, /payment_status\s*:=?=\s*'paid'/i);

// Later execution progression requires stronger provider-side Wise evidence.
assert.match(migration, /wise_transaction_reference/);
assert.match(migration, /payment_funding_method/);
assert.match(migration, /wise_acquiring_payment/);
assert.match(migration, /provider_payment_valid/);
assert.match(guards, /verifyExecutionPaymentAuthorized/);
assert.match(guards, /WISE_PROVIDER_EVIDENCE_REQUIRED/);

// BlueNotary webhook is authenticated, idempotent, and same-Matter.
assert.match(webhook, /BLUENOTARY_WEBHOOK_SECRET/);
assert.match(webhook, /computeEventHash/);
assert.match(webhook, /eventInsertError\.code === '23505'/);
assert.match(webhook, /duplicate:\s*true/);
assert.match(webhook, /matter_id:\s*matterId/);
assert.match(webhook, /ron_session_id:\s*ronSessionId/);

// Trusted provider execution evidence advances only scheduled -> in_execution.
assert.match(webhook, /payload\.event_type === 'session_started'/);
assert.match(webhook, /current !== 'scheduled'/);
assert.match(webhook, /status:\s*'in_execution'/);
assert.match(webhook, /deal_status:\s*'in_execution'/);
assert.match(webhook, /execution_at:\s*now/);
assert.match(webhook, /executed_at:\s*now/);
assert.match(webhook, /MATTER_EXECUTION_TRANSITION_REVIEW_REQUIRED/);
assert.match(webhook, /MATTER_EXECUTION_STARTED_FROM_RON/);

// Signed documents stay private/provider-backed and do not auto-advance Matter.
assert.match(signedDocs, /\.from\('documents'\)/);
assert.match(signedDocs, /storage_bucket:\s*'documents'/);
assert.match(signedDocs, /signed_document_received:\s*true/);
assert.match(signedDocs, /SIGNED_DOCS_RETRIEVED/);
assert.match(signedDocs, /base64_content\?: string \}\)\.base64_content = ''/);
assert.doesNotMatch(signedDocs, /status:\s*['\"]apostille_processing['\"]/);

// Apostille advancement is a dedicated governed operator QA transition.
assert.match(apostilleQa, /assertCanAdvanceToApostille/);
assert.match(apostilleQa, /validateExecutionTruth/);
assert.match(apostilleQa, /APOSTILLE_QA_REASON_REQUIRED/);
assert.match(apostilleQa, /current !== 'in_execution'/);
assert.match(apostilleQa, /status:\s*'apostille_processing'/);
assert.match(apostilleQa, /deal_status:\s*'apostille_processing'/);
assert.match(apostilleQa, /APOSTILLE_QA_APPROVED/);
assert.match(apostilleQa, /STALE_MATTER_STATE/);

// Legacy/generic mutation routes cannot bypass RON QA.
assert.match(legacyApostille, /USE_GOVERNED_RON_APOSTILLE_QA/);
assert.doesNotMatch(legacyApostille, /\.update\(/);
assert.match(adminStatus, /apostille_processing/);
assert.match(adminStatus, /Use the governed RON Apostille QA action/);

// Final release remains independently settlement-gated.
assert.match(finalRelease, /payment_settlement_status/);
assert.match(finalRelease, /fundsCleared/);
assert.match(finalRelease, /founder_payment_override/);
assert.match(finalRelease, /FINAL_RELEASE_BLOCKED/);

console.log('PASS post-payment Wise → scheduling → BlueNotary → Matter progression → Apostille QA corridor');
console.log('NOTE live Wise, identity/KBA, BlueNotary, courier, and delivery evidence remain separate production certification steps.');
