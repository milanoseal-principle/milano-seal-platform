import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";

// Scheduling must fail closed before a verified Wise settlement. A courtesy
// discount (DAMIANI50) reduces the amount due — it is NOT a complimentary
// authorization and never satisfies the payment gate on its own. The client
// still has to pay the discounted amount before scheduling unlocks.

const unpaidDiscountedMatter = {
  id: "matter-damiani",
  deal_id: "MS-2026-0001",
  payment_status: "unpaid",
  amount_due: 625,
  amount_paid: 0,
  discount_code: "DAMIANI50",
  discount_amount: 375,
  payment_confirmed: false,
};

test("unpaid matter cannot schedule (PAYMENT_REQUIRED semantics)", () => {
  const gate = evaluateSchedulingGate({ matter: unpaidDiscountedMatter });
  assert.equal(gate.schedulingEligible, false);
  assert.equal(gate.paymentRequirementSatisfied, false);
  assert.equal(gate.paymentRequirementMethod, "not_satisfied");
});

test("a courtesy discount alone never unlocks scheduling", () => {
  // Same matter, still unpaid, but with the discount recorded. The gate must
  // not treat an attached courtesy code as payment.
  assert.equal(evaluatePaymentGate(unpaidDiscountedMatter), "PAYMENT_REQUIRED");
  const gate = evaluateSchedulingGate({ matter: unpaidDiscountedMatter });
  assert.equal(gate.schedulingEligible, false);
});

test("verified payment of the discounted amount unlocks scheduling", () => {
  const paid = {
    ...unpaidDiscountedMatter,
    payment_status: "paid",
    amount_paid: 625,
    payment_confirmed: true,
  };
  assert.equal(evaluatePaymentGate(paid), "PAYMENT_CONFIRMED");
  const gate = evaluateSchedulingGate({ matter: paid });
  assert.equal(gate.schedulingEligible, true);
  assert.equal(gate.paymentRequirementMethod, "verified_payment");
});

test("partial payment (underpayment) does not unlock scheduling", () => {
  const partial = { ...unpaidDiscountedMatter, payment_status: "unpaid", amount_paid: 300 };
  assert.equal(evaluatePaymentGate(partial), "PARTIAL_PAYMENT");
  assert.equal(evaluateSchedulingGate({ matter: partial }).schedulingEligible, false);
});

test("open operational requirements block scheduling even when paid", () => {
  const paid = {
    ...unpaidDiscountedMatter,
    payment_status: "paid",
    amount_paid: 625,
    payment_confirmed: true,
  };
  const gate = evaluateSchedulingGate({ matter: paid, allOperationalRequirementsPassed: false });
  assert.equal(gate.schedulingEligible, false);
});
