import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateUrgency } from "@/lib/maritime/urgency/maritimeUrgency";

test("no payment blocks scheduling and routes to verify_payment", () => {
  const r = evaluateUrgency({ hoursRemaining: 40, paymentConfirmed: false });
  assert.equal(r.blocker, "Payment not confirmed — scheduling locked");
  assert.equal(r.nextOperatorAction, "verify_payment");
});

test("urgency escalates by hours remaining but never guarantees a deadline", () => {
  assert.equal(evaluateUrgency({ hoursRemaining: 4, paymentConfirmed: true, signerAuthorityVerified: true }).urgencyLevel, "critical_shipment");
  assert.equal(evaluateUrgency({ hoursRemaining: 20, paymentConfirmed: true, signerAuthorityVerified: true }).urgencyLevel, "urgent");
  assert.equal(evaluateUrgency({ hoursRemaining: 60, paymentConfirmed: true, signerAuthorityVerified: true }).urgencyLevel, "priority");
  // Deadline framing is always "requested" — not a guarantee.
  assert.equal(evaluateUrgency({ hoursRemaining: 4, paymentConfirmed: true, signerAuthorityVerified: true }).deadlineFraming, "requested");
});

test("uncertain receiving authority forces manual review", () => {
  const r = evaluateUrgency({ receivingAuthorityUncertain: true });
  assert.equal(r.urgencyLevel, "manual_review");
  assert.equal(r.manualReviewRequired, true);
});

test("unverified signer authority is a blocker", () => {
  const r = evaluateUrgency({ hoursRemaining: 40, paymentConfirmed: true, signerAuthorityVerified: false });
  assert.equal(r.nextOperatorAction, "verify_signer_authority");
});
