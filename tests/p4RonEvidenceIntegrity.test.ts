import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const status = read("lib/bluenotary/status.ts");
const webhook = read("app/api/webhooks/bluenotary/route.ts");

test("P4 provider completion is not authoritative Milano RON completion", () => {
  assert.match(status, /session_completed:\s+'SESSION_PROCESSING'/);
  assert.doesNotMatch(status, /session_completed:\s+'RON_COMPLETED'/);
  assert.match(webhook, /RON_PROVIDER_SESSION_COMPLETED/);
  assert.match(webhook, /provider_completion_is_authoritative:\s*false/);
  assert.doesNotMatch(webhook, /case 'session_completed':\s*sessionUpdate\.completed_at/);
});

test("P4 executed artifacts are immutable and content-addressed", () => {
  assert.match(webhook, /createHash\('sha256'\)/);
  assert.match(webhook, /\/executed\/\$\{sha256\}\//);
  assert.match(webhook, /upsert:\s*false/);
  assert.doesNotMatch(webhook, /upsert:\s*true/);
  assert.match(webhook, /RON_EXECUTED_DOCUMENT_CAPTURED/);
  assert.match(webhook, /immutable:\s*true/);
  assert.match(webhook, /sha256/);
});

test("P4 duplicate retrieval cannot overwrite an already-captured executed artifact", () => {
  assert.match(webhook, /signed_document_received/);
  assert.match(webhook, /if \(!existingDoc\?\.signed_document_received\)/);
  assert.match(webhook, /\.eq\('signed_document_received', false\)/);
});
