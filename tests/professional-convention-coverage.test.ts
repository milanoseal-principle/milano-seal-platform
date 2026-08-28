import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFESSIONAL_CONVENTION_DESTINATIONS,
  buildAttorneyJourney,
  getProfessionalDestination,
  isPendingApostilleConventionDestination,
  validateProfessionalJourneyCoverage,
} from "@/lib/professional/universal-attorney-journey";

test("professional Convention destination layer exposes 130 unique governed destinations", () => {
  const slugs = PROFESSIONAL_CONVENTION_DESTINATIONS.map((destination) => destination.slug);
  assert.equal(slugs.length, 130);
  assert.equal(new Set(slugs).size, 130);
  assert.equal(slugs.includes("united-states"), false);
});

test("newly governed Convention destinations resolve through the shared professional engine", () => {
  const slugs = [
    "algeria",
    "bangladesh",
    "burundi",
    "cook-islands",
    "dominica",
    "fiji",
    "guyana",
    "jamaica",
    "kosovo",
    "liberia",
    "marshall-islands",
    "mongolia",
    "niue",
    "palau",
    "samoa",
    "tonga",
    "vanuatu",
  ];

  for (const slug of slugs) {
    const destination = getProfessionalDestination(slug);
    assert.ok(destination, `${slug} should resolve`);
    assert.equal(destination.hague, true, `${slug} should have an effective Convention posture`);

    const result = buildAttorneyJourney({
      destinationSlug: slug,
      documentClass: "power_of_attorney",
      origin: "florida",
      signer: "us",
    });

    assert.equal(result.status, "REVIEW_REQUIRED");
    assert.ok(result.routeSteps.length >= 4);
    assert.ok(result.reviewRequired.includes("Receiving-authority requirements"));
  }
});

test("Thailand and Viet Nam stay visible but fail closed before Convention entry into force", () => {
  for (const slug of ["thailand", "vietnam"]) {
    const destination = getProfessionalDestination(slug);
    assert.ok(destination);
    assert.equal(destination.hague, false);
    assert.equal(destination.apostilleRequired, false);
    assert.equal(isPendingApostilleConventionDestination(destination), true);

    const result = buildAttorneyJourney({
      destinationSlug: slug,
      documentClass: "power_of_attorney",
      origin: "florida",
      signer: "us",
      receivingAuthority: "Professional receiving authority",
    });

    assert.equal(result.status, "READY_FOR_INTAKE");
    assert.ok(result.routeSteps.some((step) => /entry-into-force|interim authentication/i.test(step)));
    assert.equal(result.routeSteps.some((step) => /Florida apostille authority review/i.test(step)), false);
    assert.ok(result.reviewRequired.some((item) => /entry-into-force|interim authentication/i.test(item)));
  }
});

test("all 130 governed professional destinations pass the same route engine", () => {
  const coverage = validateProfessionalJourneyCoverage();
  assert.equal(coverage.length, 130);
  assert.deepEqual(coverage.filter((result) => !result.valid), []);
});
