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
