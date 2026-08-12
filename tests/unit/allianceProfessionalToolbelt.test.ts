import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateDocumentReadiness,
  projectApostilleRoute,
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
