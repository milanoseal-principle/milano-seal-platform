import test from "node:test";
import assert from "node:assert/strict";

import {
  buildApostilleRoute,
  projectApostilleRoute,
} from "../../lib/alliance/professionalToolbelt";

test("federal non-Hague consular projection cannot resolve READY", () => {
  const result = projectApostilleRoute({
    originState: "Florida",
    destinationCountry: "United Arab Emirates",
    documentType: "FBI background check",
    issuingAuthority: "federal",
    urgency: "standard",
  });

  assert.equal(result.destination.slug, "uae");
  assert.equal(result.destination.routeType, "consular_legalization");
  assert.equal(result.routeStatus, "REVIEW_REQUIRED");
  assert.ok(result.authorityPath.some((step) => /Department of State/i.test(step)));
  assert.ok(result.authorityPath.some((step) => /consular/i.test(step)));
  assert.ok(result.reviewReasons.some((reason) => /Non-Hague|consular/i.test(reason)));
});

test("compatibility route architect resolves UAE aliases through canonical registry", () => {
  const result = buildApostilleRoute({
    originatingState: "Florida",
    destinationCountry: "United Arab Emirates",
    destinationSlug: "United Arab Emirates",
    documentType: "FBI background check",
    signingRequirement: "already_issued",
    issuance: "federal",
    urgency: "standard",
  });

  assert.equal(result.reviewRequired, true);
  assert.match(result.routeIndicated, /consular/i);
  assert.match(result.embassyConsideration, /operator review required/i);
  assert.ok(
    result.authorityPath.some((step) => /Department of State|federal/i.test(step)),
    "Federal authority path must remain visible to the operator",
  );
});

test("Hague private-document route remains eligible for READY when no review flags exist", () => {
  const result = projectApostilleRoute({
    originState: "Florida",
    destinationCountry: "Italy",
    documentType: "Power of Attorney",
    issuingAuthority: "private",
    urgency: "standard",
  });

  assert.equal(result.destination.routeType, "hague_apostille");
  assert.equal(result.routeStatus, "READY");
  assert.equal(result.reviewReasons.length, 0);
});
