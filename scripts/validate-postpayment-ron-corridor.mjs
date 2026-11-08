import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const migration = read('supabase/migrations/089_verified_settlement_scheduling_gate.sql');
const guards = read('lib/bluenotary/guards.ts');
const webhook = read('app/api/webhooks/bluenotary/route.ts');
const apostilleQa = read('app/api/dashboard/ron/sessions/[id]/apostille-qa/route.ts');
const legacyApostille = read('app/api/deals/[id]/apostille/route.ts');
const adminStatus = read('app/api/admin/matters/[id]/status/route.ts');
// P4b: executed capture is shared by the retrieval route and webhook via lib/ron/executedCapture.ts.
const signedRoute = read('app/api/dashboard/ron/sessions/[id]/signed-documents/route.ts');
const executedCapture = read('lib/ron/executedCapture.ts');
const signedDocs = signedRoute + executedCapture;
const finalRelease = read('lib/release/performFinalRelease.ts');

// Observation alone cannot authorize scheduling or execution. The current
// migration and shared gate require exact, verified Wise settlement.
assert.match(migration, /NEW\.payment_confirmed is true/);
assert.match(migration, /NEW\.payment_settlement_status = 'cleared'/);
assert.match(migration, /round\(NEW\.amount_paid \* 100\) = round\(NEW\.amount_due \* 100\)/);
assert.match(migration, /verified Wise settlement required/);
assert.doesNotMatch(migration, /observed_submission_valid|payment_observed_at/);
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
const storage = read('lib/bluenotary/signedDocumentStorage.ts');
const evidenceMigration = read('supabase/migrations/20261108042000_p4_ron_statutory_evidence.sql');
assert.match(signedDocs, /captureExecutedRonDocuments/);
assert.doesNotMatch(signedRoute, /storeRONExecutedDocuments/);
assert.match(signedDocs, /ron_statutory_evidence_verified/);
assert.match(signedDocs, /SIGNED_DOCS_RETRIEVED/);
assert.match(storage, /storage\.from\('documents'\)\.upload/);
assert.match(storage, /upsert:false/);
assert.match(storage, /createHash\('sha256'\)/);
assert.match(storage, /capture_ron_executed_document/);
assert.match(evidenceMigration, /signed_document_received[\s\S]*true/);
assert.match(evidenceMigration, /source_sha256,executed_version_id,source_version_id/);
assert.doesNotMatch(signedRoute, /base64_content/);
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
assert.match(finalRelease, /assertPaymentConfirmed\(deal,'release'\)/);
assert.doesNotMatch(finalRelease,/founder_payment_override_at|PAYMENT_RELEASE_OVERRIDE_APPROVED/);
assert.match(finalRelease, /FINAL_RELEASE_BLOCKED/);

console.log('PASS post-payment Wise → scheduling → BlueNotary → Matter progression → Apostille QA corridor');
console.log('NOTE live Wise, identity/KBA, BlueNotary, courier, and delivery evidence remain separate production certification steps.');
