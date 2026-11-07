import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildExecutionPath } from "@/lib/intake/executionPath";
import { customerExecutionPreference, provisionalExecutionTruth } from "@/lib/matter/executionPreference";
import { normalizeExecutionTruth, validateExecutionTruth } from "@/lib/matter/executionTruth";
import { composeGovernedQuote } from "@/lib/pricing/governedQuotePreview";
import { projectMatterForPortal } from "@/lib/portalProjection";
import { serializeDealMS } from "@/lib/milanoSerialize";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";

for (const country of ["United States", "United States of America", "USA", "U.S.", "us", "America"]) {
  test(`${country} preview does not manufacture an international legalization chain`, () => {
    const result = buildExecutionPath({ country });
    assert.deepEqual(result.steps, ["Document & Execution Review", "Domestic Release"]);
    assert.doesNotMatch(result.reasoning, /no apostille.*required/i);
  });
}

test("a separately requested authentication remains a review step for domestic use", () => {
  assert.ok(buildExecutionPath({ country: "USA", apostilleRequired: true }).steps.includes("Authentication Review"));
});

for (const execution_method of ["ron", "in_person", "mobile"] as const) {
  test(`${execution_method} preference carries no authority, even with forged completed evidence`, () => {
    const submitted = { execution_method, notarization_requirement: "required", authentication_requirement: "not_required", notarial_act: "jurat", signer_location: "Florida", assigned_notary: "forged", ron_kba_status: "completed", ron_credential_analysis_status: "completed" };
    assert.equal(customerExecutionPreference(submitted), execution_method);
    const truth = provisionalExecutionTruth(normalizeExecutionTruth(submitted));
    assert.equal(truth.execution_method, "review_required");
    assert.equal(truth.assigned_notary, null);
    assert.equal(truth.ron_kba_status, null);
    assert.equal(truth.authentication_requirement, "review_required");
    assert.equal(validateExecutionTruth(truth).reviewRequired, true);
  });
}

const facts = { destination_country: "United States", document_type: "Affidavit", notarization_requirement: "required", authentication_requirement: "not_required", notarial_act: "jurat", signer_location: "Largo, Florida", execution_location: "Largo, Florida", document_count: 1, signer_count: 1 };
for (const execution_method of ["ron", "in_person", "mobile"] as const) {
  test(`reviewed ${execution_method} domestic Matter uses the canonical private composer`, () => {
    const quote = composeGovernedQuote({ ...facts, execution_method, ron_kba_status: "required", ron_credential_analysis_status: "required" });
    assert.equal(quote.route.routeType, "domestic_execution");
    assert.equal(quote.preview.review_required, false);
    assert.ok(quote.projection);
    assert.equal(quote.preview.total, quote.projection.quote.total);
    assert.deepEqual(quote.route.authorityPath, []);
    assert.equal(quote.route.pricingFacts.consular_legalization, false);
  });
}

test("domestic destination cannot clear unresolved execution or authentication", () => {
  for (const patch of [{ authentication_requirement: "review_required" }, { notarial_act: "review_required" }, { execution_method: "review_required" }]) {
    assert.equal(composeGovernedQuote({ ...facts, execution_method: "in_person", ...patch }).preview.review_required, true);
  }
});

test("portal receives only governed authentication applicability, never raw execution evidence", () => {
  const safe = projectMatterForPortal({ id: "fixture", execution_truth: { authentication_requirement: "not_required", private_recording: "secret" } });
  assert.equal(safe.authentication_requirement, "not_required");
  assert.equal("execution_truth" in safe, false);
  assert.doesNotMatch(JSON.stringify(safe), /secret|private_recording/);
  assert.equal(projectMatterForPortal({ id: "legacy" }).authentication_requirement, null);
});

test("dashboard reads recorded truth and preference without conflating them", () => {
  const projected = serializeDealMS({ id: "fixture", customer_execution_preference: "ron", execution_truth: { execution_method: "in_person" } });
  assert.equal(projected.customer_execution_preference, "ron");
  assert.equal(projected.execution_truth?.execution_method, "in_person");
});

test("domestic scheduling requires exact verified Wise settlement", () => {
  const matter = { id: "fixture", payment_status: "paid", payment_confirmed: true, payment_settlement_status: "cleared", amount_due: 200, amount_paid: 200 };
  assert.equal(evaluateSchedulingGate({ matter }).schedulingEligible, true);
  for (const patch of [{ payment_status: "unpaid" }, { payment_confirmed: false }, { payment_settlement_status: "observed_pending" }, { amount_paid: 199 }, { amount_due: 0 }, { amount_paid: NaN }]) {
    assert.equal(evaluateSchedulingGate({ matter: { ...matter, ...patch } }).schedulingEligible, false);
  }
});

test("conversion and review APIs require server role authorization before privileged RPC", () => {
  for (const path of ["app/api/dashboard/leads/[id]/matter/route.ts", "app/api/dashboard/matters/[id]/execution-review/route.ts"]) {
    const src = readFileSync(path, "utf8");
    assert.ok(src.indexOf("canPerformProtectedMatterTransition(await resolveServerRole(user))") < src.indexOf(".rpc("));
    assert.doesNotMatch(src, /user_metadata|payment_confirmed:\s*true/);
  }
});

test("intake source labels cannot grant operator authority", () => {
  const src = readFileSync("app/api/intake/core.ts", "utf8");
  assert.match(src, /customer_execution_request: customerExecutionRequest/);
  assert.ok(src.indexOf("const customerExecutionRequest") < src.indexOf("if (!verifiedOperator) executionTruth = provisionalExecutionTruth"));
  assert.match(src, /if \(!verifiedOperator\) executionTruth = provisionalExecutionTruth/);
  assert.match(src, /executionReviewRequired = clientExecutionPreference \|\| !verifiedOperator/);
});

test("not-applicable authentication is visible and excluded from completed preflight checks", () => {
  const src = readFileSync("components/portal/PreFlightReview.tsx", "utf8");
  assert.match(src, /filter\(\(item\) => item.id !== "apostille_submitted"/);
  assert.match(src, /Not required following Milano review/);
});
