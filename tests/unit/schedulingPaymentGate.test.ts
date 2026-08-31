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
  // What unlocks the gate is a SETTLED payment: payment_status "paid" with
  // amount_paid covering amount_due. The trigger is settled money, not a flag.
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

test("a payment_confirmed flag without a settled payment does NOT unlock scheduling", () => {
  // Guards against a paid-looking row: the confirmation flag is set but no money
  // has settled (still unpaid, amount_paid 0). The gate keys off settled money,
  // so this must remain blocked — a flag alone can never unlock scheduling.
  const flaggedButUnsettled = {
    ...unpaidDiscountedMatter,
    payment_status: "unpaid",
    amount_paid: 0,
    payment_confirmed: true,
  };
  assert.equal(evaluatePaymentGate(flaggedButUnsettled), "PAYMENT_REQUIRED");
  assert.equal(
    evaluateSchedulingGate({ matter: flaggedButUnsettled }).schedulingEligible,
    false,
  );
});

test("partial payment (underpayment) does not unlock scheduling", () => {
  const partial = { ...unpaidDiscountedMatter, payment_status: "unpaid", amount_paid: 300 };
  assert.equal(evaluatePaymentGate(partial), "PARTIAL_PAYMENT");
  assert.equal(evaluateSchedulingGate({ matter: partial }).schedulingEligible, false);
});

// --- Governed Wise submission unlocks scheduling without authoring paid state ---

const observedSubmission = {
  id: "matter-tiffany",
  deal_id: "MS-2026-4887",
  payment_status: "unpaid",
  payment_confirmed: false,
  amount_due: 6.88,
  amount_paid: 0,
  currency: "USD",
  wise_reference: "MS-2026-4887",
  payment_settlement_status: "observed_pending",
  payment_observed_at: "2026-08-31T12:00:00.000Z",
  payment_observed_amount: 6.88,
  payment_observed_currency: "USD",
  payment_observed_reference: "MS-2026-4887",
};

test("governed Wise submission unlocks scheduling while unpaid (Tiffany MS-2026-4887)", () => {
  const gate = evaluateSchedulingGate({ matter: observedSubmission });
  assert.equal(gate.schedulingEligible, true);
  assert.equal(gate.paymentRequirementSatisfied, true);
  assert.equal(gate.paymentRequirementMethod, "wise_submission_observed");
  // Never authors paid state.
  assert.equal(evaluatePaymentGate(observedSubmission), "PAYMENT_REQUIRED");
});

test("legacy observation without a recorded snapshot is trusted (not failed closed)", () => {
  const legacy = {
    ...observedSubmission,
    payment_observed_amount: null,
    payment_observed_currency: null,
    payment_observed_reference: null,
  };
  assert.equal(evaluateSchedulingGate({ matter: legacy }).schedulingEligible, true);
});

test("material amount mutation after submission fails scheduling closed", () => {
  const mutated = { ...observedSubmission, amount_due: 7.88 };
  const gate = evaluateSchedulingGate({ matter: mutated });
  assert.equal(gate.schedulingEligible, false);
  assert.equal(gate.paymentRequirementMethod, "not_satisfied");
  assert.match(gate.reason, /changed after the recorded submission/);
});

test("currency mutation after submission fails scheduling closed", () => {
  const mutated = { ...observedSubmission, currency: "EUR" };
  assert.equal(evaluateSchedulingGate({ matter: mutated }).schedulingEligible, false);
});

test("Wise reference mutation after submission fails scheduling closed", () => {
  const mutated = { ...observedSubmission, wise_reference: "MS-2026-9999" };
  assert.equal(evaluateSchedulingGate({ matter: mutated }).schedulingEligible, false);
});

test("failed/mismatch settlement state removes submission scheduling authority", () => {
  for (const settlement of ["failed", "mismatch_review", "refunded"]) {
    const invalid = { ...observedSubmission, payment_settlement_status: settlement };
    assert.equal(
      evaluateSchedulingGate({ matter: invalid }).schedulingEligible,
      false,
      settlement,
    );
  }
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
