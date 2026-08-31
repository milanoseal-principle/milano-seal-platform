import test from "node:test";
import assert from "node:assert/strict";

import { RON_STATE_REGISTRY } from "@/lib/alliance/ron/ronStateRegistry";
import { assessRonPartner } from "@/lib/alliance/ron/ronPartnerVerification";
import { evaluateRonDispatch } from "@/lib/alliance/ron/ronDispatchRules";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";

const partner: RonPartnerRecord = {
  id: "p1",
  fullName: "Test Notary",
  email: "test@example.com",
  stateCommissioned: "Florida",
  commissionNumber: "ABC123",
  commissionExpiration: "2099-01-01",
  ronAuthorized: true,
  ronPlatforms: ["Example Platform"],
  mobileAvailable: true,
  languages: ["English", "Spanish"],
  availability: "Weekdays",
  serviceArea: "Tampa Bay",
  eoProvider: "Example Carrier",
  eoPolicyLimit: "$25,000",
  backgroundCheckStatus: "Cleared",
  apostilleExperience: true,
  internationalDocumentExperience: true,
  shippingDropoffAccess: true,
  status: "APPROVED",
  reviewedAt: "2026-08-31T00:00:00Z",
  updatedAt: "2026-08-31T00:00:00Z",
};

test("priority state registry fails closed until official authority review", () => {
  assert.equal(RON_STATE_REGISTRY.length, 20);
  for (const state of RON_STATE_REGISTRY) {
    assert.equal(state.coverageStatus, "REVIEW_REQUIRED");
  }
});

test("credential-ready partner does not bypass state authority review", () => {
  const assessment = assessRonPartner(partner);
  assert.equal(assessment.level, "PRIORITY_DISPATCH_PARTNER");

  const decision = evaluateRonDispatch({
    partner,
    signerState: "Florida",
    receivingAuthorityRonAccepted: true,
    wetInkRequired: false,
  });

  assert.equal(decision.eligible, false);
  assert.equal(decision.status, "REVIEW_REQUIRED");
  assert.ok(decision.reasons.some((reason) => /state RON authority/i.test(reason)));
});

test("unknown receiving-authority acceptance blocks RON dispatch", () => {
  const decision = evaluateRonDispatch({
    partner,
    signerState: "Florida",
    receivingAuthorityRonAccepted: null,
    wetInkRequired: false,
  });

  assert.equal(decision.eligible, false);
  assert.ok(decision.reasons.some((reason) => /receiving-authority/i.test(reason)));
});

test("wet-ink requirement blocks RON dispatch", () => {
  const decision = evaluateRonDispatch({
    partner,
    signerState: "Florida",
    receivingAuthorityRonAccepted: true,
    wetInkRequired: true,
  });

  assert.equal(decision.eligible, false);
  assert.ok(decision.reasons.some((reason) => /wet-ink/i.test(reason)));
});
