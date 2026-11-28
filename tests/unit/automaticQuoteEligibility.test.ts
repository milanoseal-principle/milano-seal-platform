import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAutomaticQuoteEligibility, type VerifiedAutomaticQuoteScope } from "@/lib/pricing/automaticQuoteEligibility";
import { composeGovernedQuote } from "@/lib/pricing/governedQuotePreview";
import { splitFiftyFiftyCents, toCents } from "@/lib/pricing/paymentSplit";

const now = Date.parse("2026-11-27T12:00:00Z");
const scope: VerifiedAutomaticQuoteScope = {
  documentType: "Affidavit",
  originState: "Florida",
  destinationCountry: "United States",
  tier: "signature",
  executionReviewId: "synthetic-execution-evidence",
  clientRequirementsEvidenceId: "synthetic-client-evidence",
  addOnEvidenceId: "synthetic-scope-evidence",
  courier: { disposition: "verified", evidenceId: "synthetic-courier-evidence", clientChargeCents: 1251 },
  facts: {
    execution_method: "in_person", notarization_requirement: "required", notarial_act: "jurat",
    authentication_requirement: "not_required", signer_location: "Largo, Florida",
    execution_location: "Largo, Florida", document_count: 1, signer_count: 1,
  },
};
const policy = {
  id: "synthetic-policy",
  approvedBy: "synthetic-reviewer",
  effectiveAt: "2026-11-27T11:00:00Z",
  expiresAt: "2026-11-27T13:00:00Z",
  scopes: [scope],
};

test("an exact approved verified scope uses the existing composer and integer split", () => {
  for (const tier of ["signature", "priority", "executive"] as const) {
    const candidate = { ...scope, tier };
    const { preview } = composeGovernedQuote({
      ...candidate.facts, document_type: candidate.documentType, origin_state: candidate.originState,
      destination_country: candidate.destinationCountry, matter_base: tier, courier_cost: 12.51,
    });
    assert.equal(preview.review_required, false);
    assert.ok(preview.total);
    const totalCents = toCents(preview.total);
    assert.deepEqual(evaluateAutomaticQuoteEligibility(candidate, { ...policy, scopes: [structuredClone(candidate)] }, now), {
      status: "eligible", policyId: policy.id, totalCents, ...splitFiftyFiftyCents(totalCents), currency: "USD",
    });
  }
});

test("missing, future, or expired approvals never establish eligibility", () => {
  for (const [approval, time] of [
    [null, now], [policy, now - 60 * 60 * 1000 - 1], [policy, now + 60 * 60 * 1000],
  ] as const) {
    assert.deepEqual(evaluateAutomaticQuoteEligibility(scope, approval, time), {
      status: "review_required", reason: "POLICY_REQUIRED",
    });
  }
});

test("changed scope and missing evidence stay nonpayable", () => {
  for (const candidate of [
    { ...scope, documentType: "Birth certificate" },
    { ...scope, originState: "Nevada" },
    { ...scope, destinationCountry: "Italy" },
    { ...scope, tier: "executive" as const },
    { ...scope, facts: { ...scope.facts, translation_coordination: true } },
    { ...scope, courier: { ...scope.courier, clientChargeCents: 0 } },
    { ...scope, clientRequirementsEvidenceId: "" },
  ]) {
    assert.deepEqual(evaluateAutomaticQuoteEligibility(candidate, policy, now), {
      status: "review_required", reason: "SCOPE_REQUIRED",
    });
  }
});

test("an approval cannot override canonical review or an unintegrated discount", () => {
  for (const facts of [
    { ...scope.facts, authentication_requirement: "review_required" },
    { ...scope.facts, discount_amount: 1 },
    { ...scope.facts, discount_code: "SYNTHETIC" },
    { ...scope.facts, manual_adjustment: -1 },
  ]) {
    const candidate = { ...scope, facts };
    assert.deepEqual(evaluateAutomaticQuoteEligibility(candidate, { ...policy, scopes: [candidate] }, now), {
      status: "review_required", reason: "CANONICAL_REVIEW_REQUIRED",
    });
  }
});
