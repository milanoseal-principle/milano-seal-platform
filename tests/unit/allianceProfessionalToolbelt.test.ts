import test from "node:test";
import assert from "node:assert/strict";

import {
  buildApostilleRoute,
  evaluateDocumentReadiness,
  projectApostilleRoute,
  scanDocumentReadiness,
} from "../../lib/alliance/professionalToolbelt";

test("Italy private document projects a Hague route without an acceptance guarantee", () => {
  const result = projectApostilleRoute({
    originState: "Florida",
    destinationCountry: "Italy",
    documentType: "Power of Attorney",
    issuingAuthority: "private",
    urgency: "standard",
  });
  assert.equal(result.destination.routeType, "hague_apostille");
  assert.equal(result.routeStatus, "READY");
  assert.ok(result.authorityPath.some((step) => /Hague apostille/i.test(step)));
  assert.match(result.safetyNotice, /does not guarantee foreign acceptance/i);
});

test("federal non-Hague / consular route fails closed to review", () => {
  const result = projectApostilleRoute({
    originState: "Florida",
    destinationCountry: "United Arab Emirates",
    documentType: "Corporate document",
    issuingAuthority: "federal",
    urgency: "standard",
  });
  assert.equal(result.routeStatus, "REVIEW_REQUIRED");
  assert.ok(result.authorityPath.some((step) => /Department of State/i.test(step)));
  assert.ok(result.reviewReasons.length > 0);
});

test("rush timing is review-required even when destination route is otherwise known", () => {
  const result = projectApostilleRoute({
    originState: "Florida",
    destinationCountry: "Italy",
    documentType: "Affidavit",
    issuingAuthority: "private",
    urgency: "rush",
  });
  assert.equal(result.routeStatus, "REVIEW_REQUIRED");
  assert.ok(result.reviewReasons.some((reason) => /rush timing/i.test(reason)));
});

test("document readiness blocks missing document or unusable scan and otherwise can be ready", () => {
  const blocked = evaluateDocumentReadiness({
    documentPresent: false,
    signatureBlocksPresent: true,
    signerCountKnown: true,
    datesComplete: true,
    venuePresent: true,
    notarialWordingConfirmed: true,
    missingPages: false,
    duplicatePages: false,
    scanUsable: false,
    foreignLanguage: false,
    destinationConfirmed: true,
    authenticationPathConfirmed: true,
  });
  assert.equal(blocked.status, "BLOCKED");
  assert.ok(blocked.blockers.length >= 2);

  const ready = evaluateDocumentReadiness({
    documentPresent: true,
    signatureBlocksPresent: true,
    signerCountKnown: true,
    datesComplete: true,
    venuePresent: true,
    notarialWordingConfirmed: true,
    missingPages: false,
    duplicatePages: false,
    scanUsable: true,
    foreignLanguage: false,
    destinationConfirmed: true,
    authenticationPathConfirmed: true,
  });
  assert.equal(ready.status, "READY");
  assert.equal(ready.blockers.length, 0);
  assert.equal(ready.reviewItems.length, 0);
});

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
