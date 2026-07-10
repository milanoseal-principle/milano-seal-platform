import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canRecordAward,
  isInsuranceBound,
  isReferenceUsable,
  containsBannedClaim,
  unknownIfBlank,
} from "@/lib/procurement/procurementSafety";

test("award requires documented, verified evidence", () => {
  assert.equal(canRecordAward({ awardEvidenceRef: null, verified: true }), false);
  assert.equal(canRecordAward({ awardEvidenceRef: "doc-1", verified: false }), false);
  assert.equal(canRecordAward({ awardEvidenceRef: "doc-1", verified: true }), true);
});

test("insurance is bound only with bound status (not broker letter)", () => {
  assert.equal(isInsuranceBound("broker_letter"), false);
  assert.equal(isInsuranceBound("pending"), false);
  assert.equal(isInsuranceBound("bound"), true);
});

test("reference usable only when consent confirmed", () => {
  assert.equal(isReferenceUsable("requested"), false);
  assert.equal(isReferenceUsable("confirmed"), true);
});

test("banned public claims are detected", () => {
  assert.equal(containsBannedClaim("We are TSA approved"), true);
  assert.equal(containsBannedClaim("guaranteed award"), true);
  assert.equal(containsBannedClaim("Administrative coordination only"), false);
});

test("unknown/blank values normalize to null, never guessed", () => {
  assert.equal(unknownIfBlank(""), null);
  assert.equal(unknownIfBlank(undefined), null);
  assert.equal(unknownIfBlank("value"), "value");
});
