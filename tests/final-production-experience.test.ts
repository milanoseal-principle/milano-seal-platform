import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_PROFESSIONAL_DESTINATIONS,
  HAGUE_PROFESSIONAL_DESTINATIONS,
  buildAttorneyJourney,
  getProfessionalDestination,
  validateProfessionalJourneyCoverage,
} from "../lib/professional/universal-attorney-journey";
import {
  STEP12_SUPPORT,
  evaluateStep12Planning,
} from "../lib/export/step12-planning";
import { sanitizeProfessionalSession } from "../lib/professional/professional-session";

test("professional destination authority exposes one record per slug", () => {
  const slugs = CANONICAL_PROFESSIONAL_DESTINATIONS.map((destination) => destination.slug);
  assert.equal(slugs.length, new Set(slugs).size);
  assert.equal(CANONICAL_PROFESSIONAL_DESTINATIONS.filter((destination) => destination.slug === "mexico").length, 1);
});

test("Mexico resolves to a Hague apostille posture with receiving-authority review", () => {
  const mexico = getProfessionalDestination("mexico");
  assert.ok(mexico);
  assert.equal(mexico.hague, true);
  assert.equal(mexico.apostilleRequired, true);

  const journey = buildAttorneyJourney({
    destinationSlug: "mexico",
    documentClass: "power_of_attorney",
    origin: "florida",
    signer: "us",
  });
  assert.equal(journey.status, "REVIEW_REQUIRED");
  assert.ok(journey.routeSteps.some((step) => /Florida apostille authority review/i.test(step)));
  assert.ok(journey.reviewRequired.some((item) => /Receiving-authority requirements/i.test(item)));
});

test("every governed Hague professional destination passes the shared journey", () => {
  assert.ok(HAGUE_PROFESSIONAL_DESTINATIONS.length > 0);
  const coverage = validateProfessionalJourneyCoverage();
  const failed = coverage.filter((result) => !result.valid);
  assert.deepEqual(failed, []);
});

test("professional session sanitizer keeps only safe governed fields", () => {
  const sanitized = sanitizeProfessionalSession({
    version: 1,
    destinationSlug: "ITALY",
    documentClass: "power_of_attorney",
    origin: "florida",
    signer: "us",
    clientType: "attorney",
    questionsAnswered: ["route", "route", "payment"],
    receivingAuthority: "SHOULD NOT PERSIST",
    passportNumber: "SHOULD NOT PERSIST",
  });

  assert.equal(sanitized.destinationSlug, "italy");
  assert.equal(sanitized.documentClass, "power_of_attorney");
  assert.equal(sanitized.origin, "florida");
  assert.equal(sanitized.signer, "us");
  assert.equal(sanitized.clientType, "attorney");
  assert.deepEqual(sanitized.questionsAnswered, ["route", "payment"]);
  assert.equal("receivingAuthority" in sanitized, false);
  assert.equal("passportNumber" in sanitized, false);
});

test("STEP 12 planning model never converts support into an approval claim", () => {
  assert.equal(STEP12_SUPPORT.travelReimbursementMaxUsd, 2500);
  assert.equal(STEP12_SUPPORT.translationReimbursementMaxUsd, 500);
  assert.equal(STEP12_SUPPORT.comprehensiveExportMarketingPlanValueUsd, 7500);
  assert.equal(STEP12_SUPPORT.comprehensiveExportMarketingPlanClientContributionUsd, 500);
  assert.equal(STEP12_SUPPORT.comprehensiveExportMarketingPlanStateSupportUsd, 7000);
  assert.equal(STEP12_SUPPORT.comprehensiveEmpReimbursementCapTwoYearsUsd, 8000);
  assert.equal(STEP12_SUPPORT.comprehensiveEmpTotalSupportedValueTwoYearsUsd, 15000);

  const result = evaluateStep12Planning({
    operatingYears: 2,
    domesticBusinessYears: 2,
    usOrganizedAndOperating: true,
    meetsSbaSmallBusinessStandard: true,
    hasTradeCostResources: true,
    activeFloridaCorporation: true,
    feinLinkedToFloridaAddress: true,
    valueAddedInFlorida: true,
    newToExportOrExpandingMarket: true,
    seekingComprehensiveEmp: true,
  });

  assert.equal(result.status, "POTENTIALLY_ELIGIBLE");
  assert.equal(result.maximumPlanningValueUsd, 15000);
  assert.ok(result.notes.every((note) => !/approved|guaranteed grant/i.test(note)));
});

test("Comprehensive EMP planning fails closed below two domestic business years", () => {
  const result = evaluateStep12Planning({
    operatingYears: 1.5,
    domesticBusinessYears: 1.5,
    usOrganizedAndOperating: true,
    meetsSbaSmallBusinessStandard: true,
    hasTradeCostResources: true,
    activeFloridaCorporation: true,
    feinLinkedToFloridaAddress: true,
    valueAddedInFlorida: true,
    newToExportOrExpandingMarket: true,
    seekingComprehensiveEmp: true,
  });
  assert.equal(result.status, "NOT_YET_ELIGIBLE");
  assert.ok(result.blockingFacts.some((fact) => /two years/i.test(fact)));
});
