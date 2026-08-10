import { test } from "node:test";
import assert from "node:assert/strict";
import {
  executionTruthToLegacy,
  normalizeExecutionTruth,
  validateExecutionTruth,
} from "@/lib/matter/executionTruth";

test("mobile=false never implies RON", () => {
  const truth = normalizeExecutionTruth({ mobile: false });
  assert.equal(truth.execution_method, "review_required");
  const legacy = executionTruthToLegacy(truth);
  assert.equal(legacy.mobile, false);
  assert.equal(legacy.ron_required, false);
});

test("explicit RON remains explicit and requires signer/KBA/credential evidence", () => {
  const incomplete = normalizeExecutionTruth({
    notarization_requirement: "required",
    execution_method: "ron",
    notarial_act: "jurat",
    authentication_requirement: "not_required",
  });
  const validation = validateExecutionTruth(incomplete);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes("RON_SIGNER_LOCATION_REQUIRED"));
  assert.ok(validation.errors.includes("RON_KBA_STATUS_REQUIRED"));
  assert.ok(
    validation.errors.includes("RON_CREDENTIAL_ANALYSIS_STATUS_REQUIRED"),
  );

  const complete = normalizeExecutionTruth({
    notarization_requirement: "required",
    execution_method: "ron",
    notarial_act: "jurat",
    authentication_requirement: "not_required",
    signer_location: "Tampa, Florida",
    ron_kba_status: "required",
    ron_credential_analysis_status: "required",
  });
  assert.deepEqual(validateExecutionTruth(complete), {
    valid: true,
    reviewRequired: false,
    errors: [],
  });
});

test("in-person and mobile require an execution location", () => {
  for (const execution_method of ["in_person", "mobile"] as const) {
    const truth = normalizeExecutionTruth({
      notarization_requirement: "required",
      execution_method,
      notarial_act: "acknowledgment",
      authentication_requirement: "not_required",
    });
    assert.ok(
      validateExecutionTruth(truth).errors.includes(
        "EXECUTION_LOCATION_REQUIRED",
      ),
    );
  }
});

test("already-notarized requires jurisdiction and certificate type", () => {
  const truth = normalizeExecutionTruth({
    notarization_requirement: "not_required",
    execution_method: "already_notarized",
    notarial_act: "acknowledgment",
    authentication_requirement: "apostille",
  });
  const validation = validateExecutionTruth(truth);
  assert.ok(validation.errors.includes("NOTARY_JURISDICTION_REQUIRED"));
  assert.ok(validation.errors.includes("CERTIFICATE_TYPE_REQUIRED"));
});

test("apostille and notarization are independent decisions", () => {
  const apostilleOnly = normalizeExecutionTruth({
    notarization_requirement: "not_required",
    execution_method: "review_required",
    notarial_act: "review_required",
    authentication_requirement: "apostille",
  });
  const legacy = executionTruthToLegacy(apostilleOnly);
  assert.equal(legacy.apostille_required, true);
  assert.equal(legacy.notarization_required, false);
  assert.equal(legacy.ron_required, false);
  assert.equal(legacy.mobile, false);
});

test("document type never auto-selects acknowledgment or jurat", () => {
  const poa = normalizeExecutionTruth({
    document_type: "Power of Attorney",
    notarization_requirement: "required",
    execution_method: "in_person",
    authentication_requirement: "not_required",
    execution_location: "Tampa, Florida",
  });
  const affidavit = normalizeExecutionTruth({
    document_type: "Affidavit",
    notarization_requirement: "required",
    execution_method: "in_person",
    authentication_requirement: "not_required",
    execution_location: "Tampa, Florida",
  });
  assert.equal(poa.notarial_act, "review_required");
  assert.equal(affidavit.notarial_act, "review_required");
});

test("review-required decisions remain fail-closed", () => {
  const truth = normalizeExecutionTruth({
    notarization_requirement: "review_required",
    execution_method: "review_required",
    notarial_act: "review_required",
    authentication_requirement: "review_required",
  });
  assert.equal(validateExecutionTruth(truth).reviewRequired, true);
});
