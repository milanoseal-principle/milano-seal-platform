import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatterKnowledgeEdges,
  buildTruthAlerts,
  deriveAllianceIntelligence,
  deriveClientReturnSignal,
  deriveTrustSignal,
  reconcileMatter,
} from "@/lib/expansion/institutionalExpansion";

test("execution reconciliation blocks release when Wise evidence is incomplete", () => {
  const result = reconcileMatter({
    matterId: "MS-TEST-1",
    paymentStatus: "paid",
    wiseReference: null,
    executionVerified: true,
    authorityVerified: true,
    custodyVerified: true,
  });
  assert.equal(result.releaseBlocked, true);
  assert.match(result.discrepancies.join(" "), /Wise transaction reference/);
});

test("truth alerts are generated only from explicit reconciliation discrepancies", () => {
  const result = reconcileMatter({
    matterId: "MS-TEST-2",
    paymentStatus: "unpaid",
    releaseVerified: true,
  });
  const alerts = buildTruthAlerts(result);
  assert.ok(alerts.length > 0);
  assert.equal(alerts.every((alert) => alert.severity === "critical"), true);
});

test("knowledge graph creates only evidence-backed edges", () => {
  const edges = buildMatterKnowledgeEdges({
    matterId: "MS-TEST-3",
    clientId: "client-1",
    destinationCountry: "Italy",
    documentType: "Power of Attorney",
  });
  assert.equal(edges.length, 3);
  assert.equal(edges.some((edge) => edge.type === "matter_alliance"), false);
});

test("client return engine requires a completed Matter", () => {
  assert.equal(deriveClientReturnSignal([{ matterId: "a" }]).eligible, false);
  assert.equal(deriveClientReturnSignal([{ matterId: "b", completedAt: "2026-01-01T00:00:00Z" }]).eligible, true);
});

test("Trust Engine 2.0 never fabricates a percentage score", () => {
  const signal = deriveTrustSignal({
    authorityCurrent: true,
    identityVerified: true,
    executionCompleted: true,
    custodyVerified: false,
    deliveryVerified: false,
    exceptionsOpen: 0,
  });
  assert.equal(signal.status, "insufficient_evidence");
  assert.equal(signal.verifiedSignals, 3);
  assert.equal("score" in signal, false);
});

test("Alliance intelligence fails closed on compliance, capacity or exceptions", () => {
  const result = deriveAllianceIntelligence({
    allianceId: "alliance-1",
    active: true,
    complianceCurrent: true,
    capacityConfirmed: false,
    completedAssignments: 10,
    exceptionCount: 0,
  });
  assert.equal(result.dispatchEligible, false);
  assert.equal(result.status, "review_required");
});
