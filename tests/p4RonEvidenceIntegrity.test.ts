import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const storage = read("lib/bluenotary/signedDocumentStorage.ts");
const status = read("lib/bluenotary/status.ts");
// #437 capture logic now lives in the shared capture module used by both the
// webhook and the operator retrieval route; the same assertions apply to it.
const webhookRoute = read("app/api/webhooks/bluenotary/route.ts");
const webhook = [webhookRoute, read("lib/ron/executedCapture.ts"), read("lib/ron/evidence.ts")].join("\n");

test("P4 provider completion is not authoritative Milano RON completion", () => {
  assert.match(status, /session_completed:\s+'SESSION_PROCESSING'/);
  assert.doesNotMatch(status, /session_completed:\s+'RON_COMPLETED'/);
  assert.match(webhook, /RON_PROVIDER_SESSION_COMPLETED/);
  assert.match(webhook, /provider_completion_is_authoritative:\s*false/);
  assert.doesNotMatch(webhook, /case 'session_completed':\s*sessionUpdate\.completed_at/);
  assert.match(webhookRoute, /captureExecutedRonDocuments/);
});

test("P4 executed artifacts are immutable and content-addressed in shared ingestion", () => {
  assert.match(webhookRoute, /captureExecutedRonDocuments/);\n  assert.doesNotMatch(webhookRoute, /storeRONExecutedDocuments/);
  assert.match(storage, /createHash\('sha256'\)/);
  assert.match(storage, /\/executed\/\$\{digest\}\//);
  assert.match(storage, /upsert:\s*false/);
  assert.doesNotMatch(storage, /upsert:\s*true/);
  assert.match(read('supabase/migrations/20261108042000_p4_ron_statutory_evidence.sql'), /RON_EXECUTED_DOCUMENT_CAPTURED/);
  assert.match(storage, /capture_ron_executed_document/);
});

test("P4 duplicate retrieval verifies existing bytes and preserves distinct versions", () => {
  assert.match(storage, /download\(path\)/);
  assert.match(storage, /arrayBuffer/);
  assert.match(storage, /Source document mapping requires operator review/);
  assert.match(storage, /sourceHash=createHash/);
  const migration=read('supabase/migrations/20261108042000_p4_ron_statutory_evidence.sql');
  assert.match(migration, /for update/);
  assert.match(migration, /RON_EXECUTED_BYTES_CHANGED/);
  assert.match(migration, /SUBMITTED_SOURCE_HASH_REQUIRED/);
});
