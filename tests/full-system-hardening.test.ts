import assert from "node:assert/strict";
import test from "node:test";
import { ARCHITECTURE_DECISIONS, DEPENDENCY_GRAPH, ENVIRONMENT_DEPENDENCIES, detectDependencyCycles, validateArchitectureGovernance } from "@/lib/control-plane/architectureGovernance";
import { HARDENING_REGISTRY } from "@/lib/control-plane/hardeningRegistry";
import { DOCUMENT_ORIGIN_ROUTING_MATRIX, evaluateDocumentMedium, evaluateRonEligibility, evaluateTranslationGovernance, evaluateWitnessGovernance } from "@/lib/international-execution/operationalGovernance";
import { buildMatterTruthSections, deriveMatterCompleteness, findMatterDiscrepancies } from "@/lib/matter/matterTruthGovernance";
import { deriveDispatchDecision, transitionAssignment, type AllianceExecutionCapability } from "@/lib/alliance/executionGovernance";
import { buildProvenanceEdge, deriveClientReturnProjection } from "@/lib/intelligence/controlCenter";

test("architecture decisions 001-010 remain active and graph is acyclic", () => {
  assert.equal(ARCHITECTURE_DECISIONS.length >= 10, true);
  for (let i = 1; i <= 10; i += 1) {
    const id = `ADR-${String(i).padStart(3, "0")}`;
    assert.equal(ARCHITECTURE_DECISIONS.find((adr) => adr.id === id)?.status, "ACTIVE");
  }
  assert.deepEqual(detectDependencyCycles(DEPENDENCY_GRAPH), []);
  assert.equal(validateArchitectureGovernance().valid, true);
});

test("hardening capabilities remain registered without a second payment or Matter authority", () => {
  const ids = new Set(HARDENING_REGISTRY.map((entry) => entry.id));
  for (const id of ["international_execution_governance", "matter_truth_view", "execution_reconciliation_center", "alliance_execution_governance", "matter_evidence_ledger", "live_acceptance_37_45"]) assert.equal(ids.has(id), true, id);
  assert.equal(HARDENING_REGISTRY.filter((entry) => entry.authorityIds.includes("payment") && entry.authorityMode === "canonical").length, 0);
  assert.equal(HARDENING_REGISTRY.filter((entry) => entry.id.includes("state_machine")).length, 0);
});

test("RON fails closed on missing signer/notarial evidence and rejects wet ink", () => {
  assert.equal(evaluateRonEligibility({ platformEligibility: true, identityEvidence: true, KBAEvidence: true, credentialAnalysis: true, wetInkRequirement: false, foreignAcceptanceRisk: "low", receivingAuthorityState: "verified" }).state, "INSUFFICIENT_EVIDENCE");
  assert.equal(evaluateRonEligibility({ signerLocation: "Florida", documentType: "POA", notarialAct: "acknowledgment", platformEligibility: true, identityEvidence: true, KBAEvidence: true, credentialAnalysis: true, wetInkRequirement: true, foreignAcceptanceRisk: "low", receivingAuthorityState: "verified" }).state, "INELIGIBLE");
});

test("witness translation and original-copy governance fail closed", () => {
  assert.equal(evaluateWitnessGovernance({ required: "unknown", supplyMode: "unresolved", witnesses: [], eligibilityChecked: false, disqualificationFlags: [] }), "REVIEW_REQUIRED");
  assert.equal(evaluateTranslationGovernance({ requirement: "required", sourceLanguage: "English", targetLanguage: "Italian", certifiedTranslationRequired: false, completedAt: new Date().toISOString(), receivingAuthorityAcceptance: "unknown" }), "INCOMPLETE");
  assert.equal(evaluateDocumentMedium({ documentId: "doc-1", state: "ORIGINAL_REQUIRED", originalAvailable: false }), "BLOCKED");
});

test("document origin matrix preserves federal and state authority boundaries", () => {
  const federal = DOCUMENT_ORIGIN_ROUTING_MATRIX.find((row) => row.category === "federal_document");
  const state = DOCUMENT_ORIGIN_ROUTING_MATRIX.find((row) => row.category === "state_public_record");
  const fbi = DOCUMENT_ORIGIN_ROUTING_MATRIX.find((row) => row.category === "fbi_background_check");
  assert.equal(federal?.authorityClass, "federal");
  assert.equal(state?.authorityClass, "state");
  assert.equal(fbi?.possibleAuthenticationRoute, "federal");
});

test("Matter discrepancy model catches payment scheduling and closeout contradictions", () => {
  const discrepancies = findMatterDiscrepancies({ matterId: "M-1", paymentStatus: "unpaid", scheduledAt: "2026-08-27T12:00:00Z", releaseVerified: true, custodyVerified: false, completedAt: "2026-08-27T13:00:00Z", deliveryTimestamp: null });
  const classes = new Set(discrepancies.map((item) => item.class));
  assert.equal(classes.has("scheduled_without_payment"), true);
  assert.equal(classes.has("release_without_custody"), true);
  assert.equal(classes.has("completion_truth_conflict"), true);
});

test("Matter completeness is evidence-state based with no numeric score", () => {
  const sections = buildMatterTruthSections({ matterId: "M-2", clientName: "Test", destinationCountry: "Italy", documentType: "POA", originState: "FL", paymentStatus: "unpaid" });
  const result = deriveMatterCompleteness(sections);
  assert.equal(["COMPLETE", "INCOMPLETE", "BLOCKED", "REVIEW_REQUIRED", "STALE_EVIDENCE"].includes(result.overallState), true);
  assert.equal("score" in result, false);
  assert.equal("percentage" in result, false);
});

const verifiedCapability: AllianceExecutionCapability = {
  partnerId: "partner-1", jurisdictionsServed: ["FL"], ronCapability: "VERIFIED", mobileCapability: "VERIFIED", inPersonCapability: "VERIFIED", witnessCapability: "VERIFIED", languages: ["English"], translationCapability: "VERIFIED", apostilleHandling: "VERIFIED", authenticationHandling: "VERIFIED", courierCapability: "VERIFIED", documentSpecialties: ["POA"], capacityState: "VERIFIED", complianceState: "VERIFIED", certificationState: "VERIFIED",
};

test("Alliance dispatch fails closed on compliance and never computes a ranking score", () => {
  const blocked = deriveDispatchDecision({ matterId: "M-3", jurisdiction: "FL", executionMethod: "ron", requiredCapabilities: ["ron"], candidates: [{ partnerId: "partner-1", capability: { ...verifiedCapability, complianceState: "EXPIRED" }, geographyMatch: true, languageMatch: true, witnessMatch: true, conflictClear: true, available: true }], decisionBy: "operator" });
  assert.equal(blocked.eligible, false);
  assert.equal("score" in blocked, false);
});

test("Alliance reassignment requires a new partner and rationale", () => {
  const current = { matterId: "M-4", partnerId: "partner-1", state: "REASSIGNMENT_REQUIRED" as const, operatorOwner: "operator", evidence: [] };
  assert.throws(() => transitionAssignment(current, "REASSIGNED"));
  const next = transitionAssignment(current, "REASSIGNED", { newPartner: "partner-2", reassignmentRationale: ["Current verified eligibility"], priorPartner: "partner-1" });
  assert.equal(next.state, "REASSIGNED");
});

test("knowledge graph requires provenance and completed Matter evidence drives return context", () => {
  assert.equal(buildProvenanceEdge({ fromEntity: "Client A", relationship: "has_matter", toEntity: "M-5", source: "", evidenceType: "Matter", confidenceState: "SUPPORTED", staleState: "current" }), null);
  const edge = buildProvenanceEdge({ fromEntity: "Client A", relationship: "has_matter", toEntity: "M-5", source: "Canonical Matter", evidenceType: "Matter", confidenceState: "SUPPORTED", staleState: "current" });
  assert.ok(edge);
  assert.equal(deriveClientReturnProjection("C-1", [{ matterId: "M-open", open: true }]).eligibleReturnContext, false);
  assert.equal(deriveClientReturnProjection("C-1", [{ matterId: "M-done", completedAt: "2026-08-01T00:00:00Z", destinationCountry: "Italy" }]).eligibleReturnContext, true);
});

test("environment dependency registry exposes names only and never marks env existence as healthy", () => {
  assert.equal(ENVIRONMENT_DEPENDENCIES.every((dep) => dep.status !== "HEALTHY"), true);
  const serialized = JSON.stringify(ENVIRONMENT_DEPENDENCIES);
  assert.equal(/sk_live|eyJ|Bearer\s+[A-Za-z0-9]/i.test(serialized), false);
});
