import { test } from "node:test";
import assert from "node:assert/strict";
import { createDecisionReceipt, receiptFromCanonicalAction } from "../decision-receipt";

test("decision receipt uses only supplied reasons and evidence", () => {
  const receipt = createDecisionReceipt({
    action: "Do not schedule RON yet",
    reasons: ["Signer location unresolved", null, "Notarial act unresolved"],
    payment: "satisfied_for_scheduling",
    blocker: "Execution readiness",
    authority: "RON readiness engine",
    evidence: ["Matter MS-1", undefined, "Canonical readiness selectors"],
    generatedAt: "2026-09-01T12:00:00.000Z",
  });
  assert.deepEqual(receipt.why, ["Signer location unresolved", "Notarial act unresolved"]);
  assert.deepEqual(receipt.evidence, ["Matter MS-1", "Canonical readiness selectors"]);
  assert.equal(receipt.payment, "satisfied_for_scheduling");
  assert.equal(receipt.blocker, "Execution readiness");
});

test("payment state remains separate from execution blocker", () => {
  const receipt = receiptFromCanonicalAction({
    actionClass: "Authority Review",
    reason: "Notarial act unresolved",
    paymentStatus: "paid",
    matterId: "MS-2",
    state: "review_required",
    generatedAt: "2026-09-01T12:00:00.000Z",
  });
  assert.equal(receipt.payment, "paid");
  assert.equal(receipt.blocker, "Authority Review");
  assert.equal(receipt.why[0], "Notarial act unresolved");
});

test("empty reasons stay empty instead of being AI-filled", () => {
  const receipt = createDecisionReceipt({ action: "Review", reasons: [], authority: "test", evidence: [] });
  assert.deepEqual(receipt.why, []);
  assert.deepEqual(receipt.evidence, []);
});
