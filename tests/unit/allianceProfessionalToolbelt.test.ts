import assert from "node:assert/strict";
import test from "node:test";
import { buildApostilleRoute, scanDocumentReadiness } from "@/lib/alliance/professionalToolbelt";

test("route architect leaves unresolved authority questions for review", () => {
  const result = buildApostilleRoute({
    originatingState: "Florida",
    destinationCountry: "Italy",
    destinationSlug: "italy",
    documentType: "Power of Attorney",
    signingRequirement: "unknown",
    issuance: "unknown",
    urgency: "standard",
  });
  assert.equal(result.reviewRequired, true);
  assert.match(result.disclaimer, /does not guarantee foreign acceptance/i);
  assert.match(result.routeIndicated, /apostille/i);
});

test("federal non-Hague route retains consular and federal review", () => {
  const result = buildApostilleRoute({
    originatingState: "Florida",
    destinationCountry: "United Arab Emirates",
    destinationSlug: "uae",
    documentType: "FBI background check",
    signingRequirement: "already_issued",
    issuance: "federal",
    urgency: "rush",
  });
  assert.match(result.routeIndicated, /consular/i);
  assert.match(result.embassyConsideration, /operator review required/i);
  assert.ok(result.executionRestrictions.some((warning) => /Rush timing/.test(warning)));
});

test("readiness scan blocks absent or unusable documents", () => {
  const result = scanDocumentReadiness({
    documentPresent: false,
    signatureBlocks: false,
    signerCountConfirmed: false,
    dateFieldsComplete: false,
    venuePresent: false,
    notarialWordingReviewed: false,
    missingPages: true,
    duplicatePages: false,
    lowResolutionOrCutOff: false,
    foreignLanguage: false,
    receivingCountryConfirmed: false,
    authenticationPathConfirmed: false,
  });
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.findings.length > 1);
});

test("readiness scan only returns ready when every governed check passes", () => {
  const result = scanDocumentReadiness({
    documentPresent: true,
    signatureBlocks: true,
    signerCountConfirmed: true,
    dateFieldsComplete: true,
    venuePresent: true,
    notarialWordingReviewed: true,
    missingPages: false,
    duplicatePages: false,
    lowResolutionOrCutOff: false,
    foreignLanguage: false,
    receivingCountryConfirmed: true,
    authenticationPathConfirmed: true,
  });
  assert.equal(result.status, "READY");
  assert.deepEqual(result.findings, []);
});
