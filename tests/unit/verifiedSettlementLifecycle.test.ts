import { test } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_MATTER_STATES, canTransition, normalizeMatterStatus } from "@/lib/stateMachine";

test("locked Matter vocabulary includes payment confirmation and dormancy", () => {
  assert.deepEqual([...CANONICAL_MATTER_STATES], [
    "intake_received", "under_review", "quoted", "awaiting_payment",
    "payment_confirmed", "scheduled", "in_execution", "apostille_processing",
    "in_transit", "delivered", "completed", "dormant",
  ]);
  assert.equal(normalizeMatterStatus("payment_confirmed"), "payment_confirmed");
  assert.equal(normalizeMatterStatus("dormant"), "dormant");
});

test("scheduling requires the payment-confirmed predecessor", () => {
  assert.equal(canTransition("awaiting_payment", "scheduled"), false);
  assert.equal(canTransition("awaiting_payment", "payment_confirmed"), true);
  assert.equal(canTransition("payment_confirmed", "scheduled"), true);
  assert.equal(canTransition("payment_confirmed", "in_execution"), false);
  assert.equal(canTransition("dormant", "scheduled"), false);
  assert.equal(canTransition("scheduled", "payment_confirmed"), false);
});
