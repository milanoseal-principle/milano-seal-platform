import assert from "node:assert/strict";
import test from "node:test";
import {
  APOSTILLE_CONVENTION_PROFILE,
  INTERNATIONAL_EXECUTION_GOVERNANCE,
  INTERNATIONAL_EXECUTION_LANES,
  INTERNATIONAL_MATTER_FACTS,
  deriveInternationalExecutionPath,
} from "@/lib/control-plane/internationalDocumentExecutionProfile";

type InternationalExecutionLaneId = (typeof INTERNATIONAL_EXECUTION_LANES)[number]["id"];

test("HCCH Apostille Convention profile is locked to 129 Contracting Parties with Matter-specific caveat", () => {
  assert.equal(APOSTILLE_CONVENTION_PROFILE.contractingParties, 129);
  assert.equal(APOSTILLE_CONVENTION_PROFILE.authority, "HCCH");
  assert.match(APOSTILLE_CONVENTION_PROFILE.governanceNote, /not a blanket promise/i);
  assert.match(APOSTILLE_CONVENTION_PROFILE.governanceNote, /receiving-authority/i);
});

test("international execution model includes RON, state apostille, federal and non-Hague lanes", () => {
  const ids = new Set<InternationalExecutionLaneId>(INTERNATIONAL_EXECUTION_LANES.map((lane) => lane.id));
  const required: readonly InternationalExecutionLaneId[] = [
    "ron_execution",
    "state_apostille",
    "federal_authentication",
    "non_hague_legalization",
    "international_courier_release",
  ];
  for (const id of required) assert.equal(ids.has(id), true, `missing execution lane ${id}`);
});

test("canonical international Matter facts include origin, destination, receiving authority and notarial decisions", () => {
  for (const fact of ["document_identity", "origin_country_or_state", "destination_country", "receiving_authority", "notarial_act", "execution_method", "apostille_or_authentication_requirement", "competent_authority"] as const) {
    assert.equal(INTERNATIONAL_MATTER_FACTS.includes(fact), true, `missing Matter fact ${fact}`);
  }
});

test("RON is never selected when eligibility is unresolved", () => {
  const decision = deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "state", notarizationRequired: true, notarialActKnown: true, ronRequested: true, ronEligible: null, receivingAuthorityWetInkRequired: false });
  assert.equal(decision.status, "REVIEW_REQUIRED");
  assert.equal(decision.lane, "unresolved");
});

test("wet-ink receiving-authority requirement blocks RON routing", () => {
  const decision = deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "state", notarizationRequired: true, notarialActKnown: true, ronRequested: true, ronEligible: true, receivingAuthorityWetInkRequired: true });
  assert.equal(decision.status, "REVIEW_REQUIRED");
});

test("federal origin never falls into state apostille routing", () => {
  const decision = deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "federal", notarizationRequired: false, notarialActKnown: true, ronRequested: false, ronEligible: false, receivingAuthorityWetInkRequired: false });
  assert.equal(decision.status, "READY_FOR_OPERATOR_ROUTING");
  assert.equal(decision.lane, "federal_authentication");
});

test("state Hague route requires operative Matter-specific Convention evidence", () => {
  const blocked = deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: false, documentOriginLevel: "state", notarizationRequired: false, notarialActKnown: true, ronRequested: false, ronEligible: false, receivingAuthorityWetInkRequired: false });
  assert.equal(blocked.status, "REVIEW_REQUIRED");
  const ready = deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "state", notarizationRequired: false, notarialActKnown: true, ronRequested: false, ronEligible: false, receivingAuthorityWetInkRequired: false });
  assert.equal(ready.lane, "state_apostille");
});

test("domain governance forbids automatic RON, apostille and notarial-act selection", () => {
  assert.equal(INTERNATIONAL_EXECUTION_GOVERNANCE.noAutomaticRONSelection, true);
  assert.equal(INTERNATIONAL_EXECUTION_GOVERNANCE.noAutomaticApostilleSelection, true);
  assert.equal(INTERNATIONAL_EXECUTION_GOVERNANCE.noAutomaticNotarialActSelection, true);
  assert.equal(INTERNATIONAL_EXECUTION_GOVERNANCE.receivingAuthorityAlwaysControlsFinalAcceptance, true);
});
