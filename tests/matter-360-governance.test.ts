import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatterTruthChangeSummary,
  compareAcceptedMatterTruth,
  isAcceptedMatterTruthSnapshot,
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

test("Matter Truth accepted state requires valid internally ordered acceptance evidence", () => {
  assert.equal(isAcceptedMatterTruthSnapshot(accepted()), true);
  assert.equal(isAcceptedMatterTruthSnapshot(accepted({ acceptedAt: "not-a-date" })), false);
  assert.equal(isAcceptedMatterTruthSnapshot(accepted({ acceptedAt: "2026-08-27T11:59:59Z" })), false);
  assert.equal(isAcceptedMatterTruthSnapshot(accepted({ buildVersion: "  " })), false);
  assert.equal(selectAcceptedMatterTruthBaseline([accepted({ snapshotId: "prior" })], accepted({ capturedAt: "invalid" })), null);
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

test("Matter Truth comparison is deterministic across evidence order duplicates and object key order", () => {
  const prior = accepted({
    snapshotId: "snap-prior",
    capturedAt: "2026-08-26T12:00:00Z",
    acceptedAt: "2026-08-26T12:01:00Z",
    domains: { payment: { state: "VERIFIED", sourceAuthority: "Wise", authorityVersion: "wise-1", evidenceRefs: ["b", "a", "a"], value: { b: 2, a: 1 } } },
  });
  const current = accepted({ domains: { payment: { state: "VERIFIED", sourceAuthority: "Wise", authorityVersion: "wise-1", evidenceRefs: ["a", "b"], value: { a: 1, b: 2 } } } });
  const payment = compareAcceptedMatterTruth(prior, current).find((delta) => delta.domain === "payment");
  assert.equal(payment?.state, "UNCHANGED");
});

test("Matter Truth comparison prohibits cross-Matter baselines", () => {
  const prior = accepted({ snapshotId: "other-prior", matterId: "matter-2", capturedAt: "2026-08-26T12:00:00Z", acceptedAt: "2026-08-26T12:01:00Z" });
  const deltas = compareAcceptedMatterTruth(prior, accepted());
  assert.equal(deltas.every((delta) => delta.state === "UNKNOWN"), true);
  assert.match(deltas[0]?.reason ?? "", /different Matters/);
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
  assert.equal(envelope.invariants.includes("UNKNOWN_IS_NOT_FALSE"), true);
  assert.equal(validateMatterOutputEnvelope(envelope).valid, true);
  assert.throws(() => createMatterOutputEnvelope({ matterId: "matter-1", projectionId: "bad", audience: "operator", buildVersion: "v1", generatedAt: "invalid", payload: {} }));
  assert.throws(() => createMatterOutputEnvelope({ matterId: "matter-1", projectionId: "bad", audience: "operator", buildVersion: "v1", authorityVersions: { " ": "x" }, payload: {} }));
});

test("evidence reconciliation uses strong references for exact match but never authorizes canonical mutation", () => {
  const input = {
    sourceType: "wise_webhook" as const,
    evidenceHash: "sha256:abc",
    occurredAt: "2026-08-27T12:00:00Z",
    wiseReference: " WISE-123 ",
  };
  const result = reconcileMatterEvidence(input, [
    { matterId: "matter-1", wiseReference: "WISE-123" },
    { matterId: "matter-2", wiseReference: "WISE-456" },
  ]);
  assert.equal(result.state, "EXACT_MATCH");
  assert.equal(result.matterId, "matter-1");
  assert.equal(result.canonicalMutationAuthorized, false);
  assert.equal(buildEvidenceLedgerAppend(input, result)?.metadata.canonicalMutationAuthorized, false);
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

test("identity-only evidence remains review-required and cannot attach to a Matter ledger", () => {
  const input = {
    sourceType: "email_import" as const,
    evidenceHash: "sha256:ghi",
    occurredAt: "2026-08-27T12:00:00Z",
    clientEmail: "client@example.com",
    destinationCountry: "Italy",
  };
  const result = reconcileMatterEvidence(input, [
    { matterId: "matter-1", clientEmail: "client@example.com", destinationCountry: "Italy" },
  ]);
  assert.equal(result.state, "REVIEW_REQUIRED");
  assert.equal(result.canonicalMutationAuthorized, false);
  assert.equal(buildEvidenceLedgerAppend(input, result), null);
});

test("invalid evidence time fails unmatched before Matter attachment", () => {
  const result = reconcileMatterEvidence({
    sourceType: "operator_upload",
    evidenceHash: "sha256:invalid-time",
    occurredAt: "not-a-time",
    explicitMatterId: "matter-1",
  }, [{ matterId: "matter-1" }]);
  assert.equal(result.state, "UNMATCHED");
  assert.equal(result.matterId, null);
  assert.equal(buildEvidenceLedgerAppend({ sourceType: "operator_upload", evidenceHash: "sha256:invalid-time", occurredAt: "not-a-time", explicitMatterId: "matter-1" }, result), null);
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

test("Matter provenance fails closed for future timestamps missing evidence and invalid cadence", () => {
  const now = new Date("2026-08-27T12:00:00Z");
  const matrix = buildMatterProvenanceMatrix([
    { domain: "payment", sourceAuthority: "Wise", authorityMode: "EXTERNAL_VERIFIED", evidenceRefs: ["wise-1"], verifiedAt: "2026-08-28T12:00:00Z" },
    { domain: "authority", sourceAuthority: "HCCH", authorityMode: "EXTERNAL_VERIFIED", evidenceRefs: [], verifiedAt: "2026-08-27T10:00:00Z" },
    { domain: "delivery", sourceAuthority: "Carrier", authorityMode: "EXTERNAL_VERIFIED", evidenceRefs: ["delivery-1"], verifiedAt: "2026-08-27T10:00:00Z", reviewCadenceDays: 0 },
  ], now);
  assert.equal(matrix.find((row) => row.domain === "payment")?.state, "UNKNOWN");
  assert.equal(matrix.find((row) => row.domain === "authority")?.state, "UNKNOWN");
  assert.equal(matrix.find((row) => row.domain === "delivery")?.state, "UNKNOWN");
});
