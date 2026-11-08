import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  RON_EVIDENCE_CODES,
  RON_LIFECYCLE_STATES,
  decideExecutedCapture,
  evaluateRonStatutoryEvidence,
  executedArtifactPath,
  isValidRonLifecycleTransition,
  providerEventLifecycle,
  resolveRonRetention,
  ronEvidenceSnapshotHash,
  ronExecutionExitBlocker,
  sanitizeEvidencePatch,
  SESSION_EVIDENCE_FIELDS,
  SIGNER_EVIDENCE_FIELDS,
  EXTERNAL_PROVIDER_NOTARIAL_FEE,
  type RonEvidenceInput,
} from "../lib/ron/evidence";

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261108090000_p4b_ron_statutory_evidence.sql");
const webhook = read("app/api/webhooks/bluenotary/route.ts");
const capture = read("lib/ron/executedCapture.ts");
const retrieval = read("app/api/dashboard/ron/sessions/[id]/signed-documents/route.ts");
const sessionsRoute = read("app/api/dashboard/ron/sessions/route.ts");
const evidenceRoute = read("app/api/dashboard/ron/sessions/[id]/evidence/route.ts");
const verifyRoute = read("app/api/dashboard/ron/sessions/[id]/evidence/verify/route.ts");
const guards = read("lib/bluenotary/guards.ts");

const SHA = "a".repeat(64);
function completeInput(): RonEvidenceInput {
  return {
    matterFound: true,
    executionTruth: { execution_method: "ron", notarial_act: "acknowledgment", ron_kba_status: "required", ron_credential_analysis_status: "required" },
    session: {
      provider_name: "bluenotary",
      bn_session_id: "bn-1",
      notary_name: "Notary Example",
      notary_commission_number: "HH000000",
      notary_commission_jurisdiction: "FL",
      notary_commission_expires_on: "2030-01-01",
      notarial_act_type: "acknowledgment",
      notarial_act_count: 1,
      certificate_completion_reference: "cert-ref",
      electronic_signature_reference: "esig-ref",
      electronic_seal_reference: "eseal-ref",
      execution_completed_at: "2026-11-08T12:00:00.000Z",
      journal_reference: "journal-ref",
      av_recording_reference: "av-ref",
      provider_fee_evidence_classification: "EXTERNAL_PROVIDER_NOTARIAL_FEE",
      retention_class: "RON_STATUTORY_EVIDENCE",
      retention_rule: "FL_RON_10Y",
      retention_start_at: "2026-11-08T12:00:00.000Z",
      provider_evidence_references: ["bn:audit:1"],
      exception_status: "none",
      witness_requirement: "not_required",
      qc_status: "pending",
    },
    signers: [{
      id: "s1",
      party_role: "principal",
      signer_reference: "signer-ref",
      signer_location_jurisdiction: "US-FL",
      signer_location_evidence_reference: "geo-ref",
      identity_proofing_result: "passed",
      identity_proofing_reference: "idp-ref",
      credential_analysis_result: "passed",
      credential_analysis_reference: "ca-ref",
      kba_result: "passed",
      kba_reference: "kba-ref",
      awareness_willingness_confirmed_at: "2026-11-08T11:55:00.000Z",
      awareness_willingness_reference: "aw-ref",
    }],
    documents: [{ id: "d1", signed_document_received: true, executed_sha256: SHA, executed_document_version_id: "v1", custody_ledger_hash: "c1" }],
  };
}

test("P4b provider session completion is non-authoritative", () => {
  assert.equal(providerEventLifecycle("STARTED", "session_completed"), "PROVIDER_SESSION_COMPLETED");
  for (const event of ["session_completed", "session_completed_clicked", "open_call_accepted", "session_started", "join_session", "kba_succeeded"]) {
    for (const state of RON_LIFECYCLE_STATES) {
      const next = providerEventLifecycle(state, event);
      assert.ok(next !== "EVIDENCE_VERIFIED" && next !== "COMPLETED", `${event} from ${state} must not verify/complete`);
    }
  }
  assert.doesNotMatch(webhook, /ron_lifecycle_state:\s*'COMPLETED'/);
  assert.doesNotMatch(webhook, /sessionUpdate\.completed_at/);
  assert.match(webhook, /provider_session_completed_at/);
  assert.match(migration, /RON_COMPLETION_TIMESTAMP_REQUIRES_COMPLETED/);
  assert.match(migration, /RON_COMPLETION_REQUIRES_VERIFIED_EVIDENCE/);
  assert.equal(isValidRonLifecycleTransition("PROVIDER_SESSION_COMPLETED", "COMPLETED"), false);
  assert.equal(isValidRonLifecycleTransition("PROVIDER_ACCEPTED", "COMPLETED"), false);
});

test("P4b provider URL/session creation is non-authoritative", () => {
  assert.match(sessionsRoute, /ron_lifecycle_state:\s*'REQUESTED'/);
  assert.doesNotMatch(sessionsRoute, /completed_at:/);
  assert.doesNotMatch(sessionsRoute, /evidence_verified_at/);
  assert.match(migration, /RON_SESSION_MUST_START_REQUESTED/);
  assert.match(migration, /RON_SESSION_CREATION_IS_NOT_COMPLETION/);
  assert.equal(isValidRonLifecycleTransition("REQUESTED", "EVIDENCE_PENDING"), false);
});

test("P4b executed SHA-256 evidence is immutable", () => {
  assert.match(migration, /protect_ron_executed_document/);
  assert.match(migration, /RON_EXECUTED_EVIDENCE_IMMUTABLE/);
  assert.match(migration, /executed_sha256 ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(migration, /DOCUMENT_VERSION_CONTENT_IMMUTABLE/);
  assert.match(migration, /DOCUMENT_VERSION_EVIDENCE_IMMUTABLE/);
  assert.equal(decideExecutedCapture({ signed_document_received: true, executed_sha256: SHA }, "b".repeat(64)), "conflict");
});

test("P4b executed artifact cannot overwrite the source document", () => {
  const path = executedArtifactPath("m1", "s1", SHA, "deed.pdf");
  assert.equal(path, `ron/m1/s1/executed/${SHA}/deed.pdf`);
  assert.match(migration, /ron_documents_source_not_executed_check/);
  assert.doesNotMatch(retrieval, /upsert:\s*true/);
  assert.doesNotMatch(capture, /upsert:\s*true/);
  assert.match(capture, /stage: 'executed'/);
  assert.match(capture, /signed_storage_path: storagePath/);
  assert.doesNotMatch(capture, /\bstorage_path: storagePath,\s*\n\s*signed_document_received/);
});

test("P4b duplicate provider events are idempotent", () => {
  assert.match(webhook, /eventInsertError\.code === '23505'/);
  assert.match(webhook, /duplicate: true/);
  for (const state of RON_LIFECYCLE_STATES) assert.equal(isValidRonLifecycleTransition(state, state), true);
  assert.equal(providerEventLifecycle("PROVIDER_SESSION_COMPLETED", "session_completed"), null);
  assert.equal(providerEventLifecycle("EVIDENCE_PENDING", "session_started"), null);
  assert.equal(providerEventLifecycle("COMPLETED", "session_expired"), null);
  assert.match(capture, /providerEventId: `ron_executed:\$\{ronSessionId\}:\$\{sha256\}`/);
  assert.match(migration, /document_versions_ron_executed_hash_uidx/);
});

test("P4b duplicate executed-document retrieval is protected", () => {
  assert.equal(decideExecutedCapture(null, SHA), "capture");
  assert.equal(decideExecutedCapture({ signed_document_received: false }, SHA), "capture");
  assert.equal(decideExecutedCapture({ signed_document_received: true, executed_sha256: SHA }, SHA), "duplicate");
  assert.match(capture, /\.eq\('signed_document_received', false\)/);
  assert.match(capture, /RON_EXECUTED_DOCUMENT_CONFLICT/);
  assert.match(retrieval, /captureExecutedRonDocuments/);
});

test("P4b required evidence fails closed", () => {
  assert.deepEqual(evaluateRonStatutoryEvidence(completeInput(), "verify"), []);
  const drops: Array<[string, (i: RonEvidenceInput) => void, string]> = [
    ["notary", (i) => { i.session.notary_name = null; }, "NOTARY_IDENTITY"],
    ["commission", (i) => { i.session.notary_commission_number = ""; }, "NOTARY_COMMISSION"],
    ["expired commission", (i) => { i.session.notary_commission_expires_on = "2026-01-01"; }, "NOTARY_COMMISSION_EXPIRED"],
    ["journal", (i) => { i.session.journal_reference = null; }, "JOURNAL_REFERENCE"],
    ["recording", (i) => { i.session.av_recording_reference = null; }, "AV_RECORDING_REFERENCE"],
    ["seal", (i) => { i.session.electronic_seal_reference = null; }, "ELECTRONIC_SEAL"],
    ["signature", (i) => { i.session.electronic_signature_reference = null; }, "ELECTRONIC_SIGNATURE"],
    ["certificate", (i) => { i.session.certificate_completion_reference = null; }, "CERTIFICATE_COMPLETION"],
    ["kba", (i) => { i.signers[0].kba_result = "failed"; }, "KBA"],
    ["credential analysis", (i) => { i.signers[0].credential_analysis_reference = null; }, "CREDENTIAL_ANALYSIS"],
    ["identity", (i) => { i.signers[0].identity_proofing_result = null; }, "IDENTITY_PROOFING"],
    ["location", (i) => { i.signers[0].signer_location_evidence_reference = null; }, "SIGNER_LOCATION_EVIDENCE"],
    ["awareness", (i) => { i.signers[0].awareness_willingness_confirmed_at = null; }, "AWARENESS_WILLINGNESS"],
    ["oath for jurat", (i) => { i.session.notarial_act_type = "jurat"; }, "OATH_AFFIRMATION"],
    ["witness review", (i) => { i.session.witness_requirement = "review_required"; }, "WITNESS_REQUIREMENT_REVIEW"],
    ["witness evidence", (i) => { i.session.witness_requirement = "required"; }, "WITNESS_EVIDENCE"],
    ["executed doc", (i) => { i.documents = []; }, "EXECUTED_DOCUMENT"],
    ["unhashed signed doc", (i) => { i.documents.push({ id: "d2", signed_document_received: true }); }, "EXECUTED_DOCUMENT_HASH"],
    ["custody", (i) => { i.documents[0].custody_ledger_hash = null; }, "CUSTODY_LINKAGE"],
    ["exception", (i) => { i.session.exception_status = "open"; }, "EXCEPTION_OPEN"],
    ["provider refs", (i) => { i.session.provider_evidence_references = []; }, "PROVIDER_EVIDENCE_REFERENCES"],
    ["retention", (i) => { i.session.retention_start_at = null; }, "RETENTION_METADATA"],
    ["no signers", (i) => { i.signers = []; }, "SIGNER_REFERENCE"],
    ["unknown act", (i) => { i.session.notarial_act_type = null; i.executionTruth = { notarial_act: "review_required" }; }, "NOTARIAL_ACT_TYPE"],
  ];
  for (const [label, mutate, code] of drops) {
    const input = completeInput();
    mutate(input);
    assert.ok(evaluateRonStatutoryEvidence(input, "verify").includes(code as never), `${label} must block with ${code}`);
  }
  const kbaNotRequired = completeInput();
  kbaNotRequired.executionTruth = { ...kbaNotRequired.executionTruth, ron_kba_status: "not_required" };
  kbaNotRequired.signers[0].kba_result = null;
  assert.deepEqual(evaluateRonStatutoryEvidence(kbaNotRequired, "verify"), []);
  const completion = evaluateRonStatutoryEvidence(completeInput(), "complete");
  assert.ok(completion.includes("QC_EVIDENCE") && completion.includes("OPERATOR_VERIFICATION"));
  for (const code of RON_EVIDENCE_CODES) assert.ok(migration.includes(`'${code}'`), `SQL fail-closed check must emit ${code}`);
  assert.match(migration, /RON_EVIDENCE_INCOMPLETE/);
  assert.doesNotMatch(verifyRoute, /force_?complete|skip_?evidence|override|complete_?anyway/i);
});

test("P4b client role cannot mutate RON evidence", () => {
  assert.doesNotMatch(migration, /grant (insert|update|delete|all)[^;]*\bto authenticated/i);
  assert.match(migration, /revoke insert, update, delete on public\.document_versions from authenticated/);
  for (const source of [evidenceRoute, verifyRoute, retrieval]) assert.match(source, /requireDashboardAccess\(\)/);
  const patch = sanitizeEvidencePatch({ milano_ron_status: "RON_COMPLETED" }, [...SESSION_EVIDENCE_FIELDS]);
  assert.equal(patch.ok, false);
  const lifecyclePatch = sanitizeEvidencePatch({ ron_lifecycle_state: "COMPLETED" }, [...SESSION_EVIDENCE_FIELDS]);
  assert.equal(lifecyclePatch.ok, false);
});

test("P4b raw sensitive identity material is rejected", () => {
  const dataUri = sanitizeEvidencePatch({ identity_proofing_reference: "data:image/png;base64,AAAA" }, [...SIGNER_EVIDENCE_FIELDS]);
  assert.equal(dataUri.ok, false);
  const blob = sanitizeEvidencePatch({ kba_reference: "A".repeat(600) }, [...SIGNER_EVIDENCE_FIELDS]);
  assert.equal(blob.ok, false);
  const ssn = sanitizeEvidencePatch({ signer_reference: "123-45-6789" }, [...SIGNER_EVIDENCE_FIELDS]);
  assert.equal(ssn.ok, false);
  const ok = sanitizeEvidencePatch({ kba_result: "passed", kba_reference: "bluenotary:kba:evt_123" }, [...SIGNER_EVIDENCE_FIELDS]);
  assert.equal(ok.ok, true);
});

test("P4b operator correction appends audit evidence", () => {
  assert.match(evidenceRoute, /CORRECTION_REASON_REQUIRED/);
  assert.match(evidenceRoute, /RON_EVIDENCE_CORRECTED/);
  assert.match(evidenceRoute, /from\('ron_audit_events'\)\.insert/);
  assert.match(evidenceRoute, /appendMatterEvidence/);
  assert.match(evidenceRoute, /RON_EVIDENCE_FROZEN/);
  assert.match(verifyRoute, /RON_EVIDENCE_REOPENED/);
  assert.match(migration, /RON_AUDIT_EVENTS_APPEND_ONLY/);
  assert.match(migration, /RON_EVIDENCE_FROZEN/);
  assert.equal(isValidRonLifecycleTransition("EVIDENCE_VERIFIED", "EVIDENCE_PENDING"), true);
  assert.equal(isValidRonLifecycleTransition("COMPLETED", "EVIDENCE_PENDING"), false);
});

test("P4b non-RON Matter does not require RON evidence", () => {
  assert.equal(ronExecutionExitBlocker({ execution_method: "in_person" }, []), null);
  assert.equal(ronExecutionExitBlocker({ execution_method: "mobile" }, []), null);
  assert.equal(ronExecutionExitBlocker(null, []), null);
  assert.equal(ronExecutionExitBlocker({ execution_method: "ron" }, [{ ron_lifecycle_state: "EVIDENCE_PENDING" }]), "RON_COMPLETION_REQUIRED_BEFORE_EXECUTION_EXIT");
  assert.equal(ronExecutionExitBlocker({ execution_method: "ron" }, [{ ron_lifecycle_state: "COMPLETED" }]), null);
  assert.match(migration, /coalesce\(NEW\.execution_truth ->> 'execution_method', ''\) = 'ron'/);
  assert.match(guards, /assertRonExecutionCompleted/);
});

test("P4b retention metadata and verification snapshot", () => {
  const fl = resolveRonRetention("FL", "2026-11-08T12:00:00.000Z");
  assert.equal(fl.retention_rule, "FL_RON_10Y");
  assert.equal(fl.retention_until, "2036-11-08T12:00:00.000Z");
  assert.equal(resolveRonRetention("TX", "2026-11-08T12:00:00.000Z").retention_rule, "REVIEW_REQUIRED");
  assert.equal(ronEvidenceSnapshotHash(completeInput()), ronEvidenceSnapshotHash(completeInput()));
  assert.match(ronEvidenceSnapshotHash(completeInput()), /^[0-9a-f]{64}$/);
});

test("P4b migration is additive and forward-only", () => {
  assert.doesNotMatch(migration, /\bdrop table\b|\btruncate\b|\bdrop column\b|delete from public\./i);
  assert.doesNotMatch(migration, /stripe/i);
});

function readTree(path: string): string {
  if (statSync(path).isFile()) return readFileSync(path, "utf8");
  return readdirSync(path).map((entry) => readTree(join(path, entry))).join("\n");
}
const financialTruth = ["lib/pricing.ts", "lib/pricing", "lib/wise.ts", "lib/wise", "lib/payments", "lib/scheduling", "lib/safety/payment-integrity.ts"]
  .map(readTree)
  .join("\n");

test("P4b external provider notarial fee is evidence only, never Milano financial truth", () => {
  assert.equal(EXTERNAL_PROVIDER_NOTARIAL_FEE, "EXTERNAL_PROVIDER_NOTARIAL_FEE");
  // Not Milano revenue / quote / Wise expected amount / payment authority.
  assert.doesNotMatch(financialTruth, /EXTERNAL_PROVIDER_NOTARIAL_FEE|provider_fee_evidence/);
  assert.doesNotMatch(guards, /provider_fee_evidence/);
  assert.doesNotMatch(read("lib/scheduling/complimentarySchedulingGate.ts"), /provider_fee_evidence/);
  // No dollar amount is invented anywhere in the P4b fee evidence model.
  assert.doesNotMatch(migration, /provider_fee[a-z_]*\s+(numeric|integer|bigint|money|decimal)/i);
  assert.doesNotMatch(migration, /2500|25\.00|\$25/);
  assert.doesNotMatch(read("lib/ron/evidence.ts"), /2500|25\.00|\$25|fee_cents|fee_amount/);
  assert.doesNotMatch(sessionsRoute, /provider_fee[a-z_]*_(amount|cents)/);
  assert.match(sessionsRoute, /provider_fee_evidence_classification:\s*'EXTERNAL_PROVIDER_NOTARIAL_FEE'/);
  assert.match(migration, /NOT a Milano charge/);
  // The removed Milano-looking classification no longer exists.
  for (const source of [migration, read("lib/ron/evidence.ts"), sessionsRoute, capture, evidenceRoute, verifyRoute]) {
    assert.doesNotMatch(source, /RON_NOTARIAL_ACT_FEE|notarial_fee_classification|NOTARIAL_FEE_CLASSIFICATION/);
  }
});

test("P4b RON completion does not depend on a Milano-controlled notarial fee", () => {
  const withoutFeeEvidence = completeInput();
  withoutFeeEvidence.session.provider_fee_evidence_classification = null;
  withoutFeeEvidence.session.provider_fee_evidence_reference = null;
  assert.deepEqual(evaluateRonStatutoryEvidence(withoutFeeEvidence, "verify"), []);
  assert.deepEqual(
    evaluateRonStatutoryEvidence(withoutFeeEvidence, "complete").sort(),
    ["OPERATOR_VERIFICATION", "QC_EVIDENCE"],
  );
  assert.doesNotMatch(migration, /missing := missing \|\| '[A-Z_]*FEE[A-Z_]*'/);
  const recorded = sanitizeEvidencePatch({ provider_fee_evidence_reference: "bluenotary:invoice:evt_42" }, [...SESSION_EVIDENCE_FIELDS]);
  assert.equal(recorded.ok, true);
  const classificationForge = sanitizeEvidencePatch({ provider_fee_evidence_classification: "MILANO_CHARGE" }, [...SESSION_EVIDENCE_FIELDS]);
  assert.equal(classificationForge.ok, false);
});
