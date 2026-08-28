import test from "node:test";
import assert from "node:assert/strict";
import {
  HAGUE_PROFESSIONAL_DESTINATIONS,
  buildAttorneyJourney,
  validateProfessionalJourneyCoverage,
} from "@/lib/professional/universal-attorney-journey";

test("every canonical Hague destination resolves through the same professional journey engine", () => {
  assert.ok(HAGUE_PROFESSIONAL_DESTINATIONS.length > 0);
  const coverage = validateProfessionalJourneyCoverage();
  const failures = coverage.filter((item) => !item.valid);
  assert.deepEqual(failures, []);
  assert.equal(coverage.length, HAGUE_PROFESSIONAL_DESTINATIONS.length);
});

test("professional journey preserves legal-advice and receiving-authority boundaries", () => {
  const italy = buildAttorneyJourney({
    destinationSlug: "italy",
    documentClass: "power_of_attorney",
    origin: "florida",
    signer: "us",
  });

  assert.equal(italy.status, "REVIEW_REQUIRED");
  assert.ok(italy.attorneyRetains.includes("Legal advice and strategy"));
  assert.ok(italy.attorneyRetains.includes("Receiving-authority legal judgment"));
  assert.ok(italy.milanoCoordinates.includes("Apostille or authentication routing"));
  assert.ok(italy.reviewRequired.includes("Receiving-authority requirements"));
});

test("receiving-authority context advances readiness without authorizing execution", () => {
  const mexico = buildAttorneyJourney({
    destinationSlug: "mexico",
    documentClass: "power_of_attorney",
    origin: "florida",
    signer: "us",
    receivingAuthority: "Mexican receiving notary",
  });

  assert.equal(mexico.status, "READY_FOR_INTAKE");
  assert.match(mexico.intakeHref, /lane=professional/);
  assert.match(mexico.intakeHref, /destination=mexico/);
  assert.doesNotMatch(mexico.status, /EXECUTION|APPROVED|PAID/);
});

test("missing facts fail closed rather than inventing route certainty", () => {
  const partial = buildAttorneyJourney({ destinationSlug: "germany" });
  assert.equal(partial.status, "ROUTE_IDENTIFIED");
  assert.ok(partial.reviewRequired.includes("Document class"));
  assert.ok(partial.reviewRequired.includes("Document origin / issuing authority"));
});
