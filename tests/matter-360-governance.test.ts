import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatterTruthChangeSummary,
  compareAcceptedMatterTruth,
  selectAcceptedMatterTruthBaseline,
  type MatterTruthSnapshot,
} from "@/lib/matter/matterTruthArchive";
import { createMatterOutputEnvelope, validateMatterOutputEnvelope } from "@/lib/matter/outputEnvelope";
import { buildEvidenceLedgerAppend, reconcileMatterEvidence } from "@/lib/matter/evidenceIngestion";
import { buildMatterProvenanceMatrix, summarizeMatterProvenance } from "@/lib/matter/provenanceMatrix";

const accepted = (overrides: Partial<MatterTruthSnapshot> = {}): MatterTruthSnapshot => ({
  snapshotId: "snap-current",
  matterId: "matter-1",
  status: "ACCEPTED",
  capturedAt: "2026-08-27T12:00:00Z",
  acceptedAt: "2026-08-27T12:01:00Z",
  acceptedBy: "operator-1",
  buildVersion: "test",
  domains: {
    payment: { state: "VERIFIED", sourceAuthority: "Wise", authorityVersion: "wise-1", evidenceRefs: ["ev-1"], value: { settled: true } },
    authority: { state: "VERIFIED", sourceAuthority: "HCCH + receiving authority", authorityVersion: "hcch-130", evidenceRefs: ["ev-2"], value: { route: "apostille" } },
  },
  ...overrides,
});

test("Matter Truth baseline uses only the prior accepted snapshot", () => {
  const current = accepted();
  const prior = accepted({ snapshotId: "snap-prior", capturedAt: "2026-08-26T12:00:00Z", acceptedAt: "2026-08-26T12:01:00Z" });
  const pending = accepted({ snapshotId: "snap-pending", status: "PENDING_REVIEW", capturedAt: "2026-08-27T11:00:00Z", acceptedAt: null, acceptedBy: null });
  assert.equal(selectAcceptedMatterTruthBaseline([prior, pending, current], current)?.snapshotId, "snap-prior");
});

test("Matter Truth delta returns CHANGED UNCHANGED and UNKNOWN without manufacturing differences", () => {
  const prior = accepted({
    snapshotId: "snap-prior",
    capturedAt: "2026-08-26T12:00:00Z",
    acceptedAt: "2026-08-26T12:01:00Z",
    domains: {
      payment: { state: "VERIFIED", sourceAuthority: "Wise", authorityVersion: "wise-1", evidenceRefs: ["ev-1"], value: { settled: true } },
      authority: { state: "VERIFIED", sourceAuthority: "HCCH + receiving authority", authorityVersion: "hcch-129", evidenceRefs: ["ev-2"], value: { route: "apostille" } },
    },
  });
  const current = accepted();
  const summary = buildMatterTruthChangeSummary(compareAcceptedMatterTruth(prior, current));
  assert.equal(summary.unchanged.some((delta) => delta.domain === "payment"), true);
  assert.equal(summary.changed.some((delta) => delta.domain === "authority"), true);
  assert.equal(summary.unknown.some((delta) => delta.domain === "delivery"), true);
});

test("Matter Truth comparison is deterministic across evidence order and object key order", () => {
  const prior = accepted({
    snapshotId: "snap-prior",
    capturedAt: "2026-08-26T12:00:00Z",
    acceptedAt: "2026-08-26T12:01:00Z",
    domains: { payment: { state: "VERIFIED", sourceAuthority: "Wise", authorityVersion: "wise-1", evidenceRefs: ["b", "a"], value: { b: 2, a: 1 } } },
  });
  const current = accepted({ domains: { payment: { state: "VERIFIED", sourceAuthority: "Wise", authorityVersion: "wise-1", evidenceRefs: ["a", "b"], value: { a: 1, b: 2 } } } });
  const payment = compareAcceptedMatterTruth(prior, current).find((delta) => delta.domain === "payment");
  assert.equal(payment?.state, "UNCHANGED");
});

test("Matter output envelope is explicitly a MATTER_CONTROL projection and cannot become a state engine", () => {
  const envelope = createMatterOutputEnvelope({
    matterId: "matter-1",
    projectionId: "operator-matter-360",
    audience: "operator",
    buildVersion: "abc123",
    authorityVersions: { payment: "wise-event-1", authority: "hcch-130" },
    payload: { status: "review_required" },
    generatedAt: "2026-08-27T12:00:00Z",
  });
  assert.equal(envelope.sourceEngine, "MATTER_CONTROL");
  assert.equal(envelope.mutationPolicy, "READ_ONLY");
  assert.equal(envelope.invariants.includes("NO_SECOND_MATTER_ENGINE"), true);
  assert.equal(envelope.invariants.includes("NO_SECOND_PAYMENT_ENGINE"), true);
  assert.equal(validateMatterOutputEnvelope(envelope).valid, true);
});

test("evidence reconciliation uses strong references for exact match but never authorizes canonical mutation", () => {
  const result = reconcileMatterEvidence({
    sourceType: "wise_webhook",
    evidenceHash: "sha256:abc",
    occurredAt: "2026-08-27T12:00:00Z",
    wiseReference: "WISE-123",
  }, [
    { matterId: "matter-1", wiseReference: "WISE-123" },
    { matterId: "matter-2", wiseReference: "WISE-456" },
  ]);
  assert.equal(result.state, "EXACT_MATCH");
  assert.equal(result.matterId, "matter-1");
  assert.equal(result.canonicalMutationAuthorized, false);
  assert.equal(buildEvidenceLedgerAppend({ sourceType: "wise_webhook", evidenceHash: "sha256:abc", occurredAt: "2026-08-27T12:00:00Z", wiseReference: "WISE-123" }, result)?.metadata.canonicalMutationAuthorized, false);
});

test("conflicting strong evidence references fail into conflict review", () => {
  const result = reconcileMatterEvidence({
    sourceType: "shippo_webhook",
    evidenceHash: "sha256:def",
    occurredAt: "2026-08-27T12:00:00Z",
    explicitMatterId: "matter-1",
    trackingNumber: "TRACK-2",
  }, [
    { matterId: "matter-1" },
    { matterId: "matter-2", trackingNumber: "TRACK-2" },
  ]);
  assert.equal(result.state, "CONFLICT_REVIEW");
  assert.equal(result.matterId, null);
});

test("identity-only evidence remains review-required rather than silently creating truth", () => {
  const result = reconcileMatterEvidence({
    sourceType: "email_import",
    evidenceHash: "sha256:ghi",
    occurredAt: "2026-08-27T12:00:00Z",
    clientEmail: "client@example.com",
    destinationCountry: "Italy",
  }, [
    { matterId: "matter-1", clientEmail: "client@example.com", destinationCountry: "Italy" },
  ]);
  assert.equal(result.state, "REVIEW_REQUIRED");
  assert.equal(result.canonicalMutationAuthorized, false);
});

test("Matter provenance matrix preserves separate authorities and UNKNOWN for missing domains", () => {
  const matrix = buildMatterProvenanceMatrix([
    { domain: "matter", sourceAuthority: "Supabase canonical Matter", authorityMode: "CANONICAL", evidenceRefs: ["matter-1"], verifiedAt: "2026-08-27T00:00:00Z" },
    { domain: "payment", sourceAuthority: "Wise verified settlement", authorityMode: "EXTERNAL_VERIFIED", evidenceRefs: ["wise-1"], verifiedAt: "2026-08-27T00:00:00Z" },
  ], new Date("2026-08-27T12:00:00Z"));
  const summary = summarizeMatterProvenance(matrix);
  assert.equal(matrix.find((row) => row.domain === "payment")?.sourceAuthority, "Wise verified settlement");
  assert.equal(matrix.find((row) => row.domain === "delivery")?.state, "UNKNOWN");
  assert.equal(summary.unknown > 0, true);
});
