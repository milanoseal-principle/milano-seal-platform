import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";

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
  assert.equal(evaluatePaymentGate(unpaidDiscountedMatter), "PAYMENT_REQUIRED");
  assert.equal(evaluateSchedulingGate({ matter: unpaidDiscountedMatter }).schedulingEligible, false);
});

test("verified payment of the discounted amount unlocks scheduling", () => {
  const paid = { ...unpaidDiscountedMatter, payment_status: "paid", amount_paid: 625, payment_confirmed: true, payment_settlement_status: "cleared" };
  assert.equal(evaluatePaymentGate(paid), "PAYMENT_CONFIRMED");
  const gate = evaluateSchedulingGate({ matter: paid });
  assert.equal(gate.schedulingEligible, true);
  assert.equal(gate.paymentRequirementMethod, "verified_payment");
});

test("a payment_confirmed flag without a settled payment does NOT unlock scheduling", () => {
  const flaggedButUnsettled = { ...unpaidDiscountedMatter, payment_status: "unpaid", amount_paid: 0, payment_confirmed: true };
  assert.equal(evaluatePaymentGate(flaggedButUnsettled), "PAYMENT_REQUIRED");
  assert.equal(evaluateSchedulingGate({ matter: flaggedButUnsettled }).schedulingEligible, false);
});

test("partial payment (underpayment) does not unlock scheduling", () => {
  const partial = { ...unpaidDiscountedMatter, payment_status: "unpaid", amount_paid: 300 };
  assert.equal(evaluatePaymentGate(partial), "PARTIAL_PAYMENT");
  assert.equal(evaluateSchedulingGate({ matter: partial }).schedulingEligible, false);
});

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

test("governed Wise submission stays locked while unpaid (Tiffany MS-2026-4887)", () => {
  const gate = evaluateSchedulingGate({ matter: observedSubmission });
  assert.equal(gate.schedulingEligible, false);
  assert.equal(gate.paymentRequirementSatisfied, false);
  assert.equal(gate.paymentRequirementMethod, "not_satisfied");
  assert.equal(evaluatePaymentGate(observedSubmission), "PAYMENT_REQUIRED");
});

test("legacy observation with null snapshot columns cannot substitute for settlement", () => {
  const legacy = { ...observedSubmission, payment_observed_amount: null, payment_observed_currency: null, payment_observed_reference: null };
  assert.equal(evaluateSchedulingGate({ matter: legacy }).schedulingEligible, false);
});

test("observed submission from an under-selected read model fails closed", () => {
  const incomplete = {
    id: observedSubmission.id,
    deal_id: observedSubmission.deal_id,
    payment_status: observedSubmission.payment_status,
    payment_confirmed: observedSubmission.payment_confirmed,
    amount_due: observedSubmission.amount_due,
    amount_paid: observedSubmission.amount_paid,
    payment_settlement_status: observedSubmission.payment_settlement_status,
    payment_observed_at: observedSubmission.payment_observed_at,
  };
  const gate = evaluateSchedulingGate({ matter: incomplete });
  assert.equal(gate.schedulingEligible, false);
  assert.equal(gate.paymentRequirementMethod, "not_satisfied");
  assert.match(gate.reason, /integrity fields are missing/i);
});

test("material amount mutation after submission fails scheduling closed", () => {
  const gate = evaluateSchedulingGate({ matter: { ...observedSubmission, amount_due: 7.88 } });
  assert.equal(gate.schedulingEligible, false);
  assert.equal(gate.paymentRequirementMethod, "not_satisfied");
  assert.match(gate.reason, /changed after the recorded submission/);
});

test("currency mutation after submission fails scheduling closed", () => {
  assert.equal(evaluateSchedulingGate({ matter: { ...observedSubmission, currency: "EUR" } }).schedulingEligible, false);
});

test("Wise reference mutation after submission fails scheduling closed", () => {
  assert.equal(evaluateSchedulingGate({ matter: { ...observedSubmission, wise_reference: "MS-2026-9999" } }).schedulingEligible, false);
});

test("failed/mismatch settlement state removes submission scheduling authority", () => {
  for (const settlement of ["failed", "mismatch_review", "refunded"]) {
    assert.equal(evaluateSchedulingGate({ matter: { ...observedSubmission, payment_settlement_status: settlement } }).schedulingEligible, false, settlement);
  }
});

test("open operational requirements block scheduling even when paid", () => {
  const paid = { ...unpaidDiscountedMatter, payment_status: "paid", amount_paid: 625, payment_confirmed: true, payment_settlement_status: "cleared" };
  assert.equal(evaluateSchedulingGate({ matter: paid, allOperationalRequirementsPassed: false }).schedulingEligible, false);
});

test("only verified exact settlement can unlock scheduling", () => {
  const settled = {
    ...observedSubmission,
    payment_status: "paid",
    payment_confirmed: true,
    payment_settlement_status: "cleared",
    amount_paid: 6.88,
  };
  assert.equal(evaluateSchedulingGate({ matter: settled }).schedulingEligible, true);
  for (const change of [
    { payment_confirmed: false },
    { payment_confirmed: null },
    { payment_status: "unpaid" },
    { payment_settlement_status: "observed_pending" },
    { payment_settlement_status: "failed" },
    { payment_settlement_status: "refunded" },
    { payment_settlement_status: null },
    { amount_due: 0, amount_paid: 0 },
    { amount_paid: 6.87 },
    { amount_paid: 6.89 },
    { amount_paid: Number.NaN },
    { amount_paid: Number.POSITIVE_INFINITY },
    { amount_due: Number.NaN },
  ]) {
    const result = evaluateSchedulingGate({ matter: { ...settled, ...change } });
    assert.equal(result.schedulingEligible, false, JSON.stringify(change));
    assert.equal(result.paymentRequirementSatisfied, false);
  }
});

test("zero-value courtesy authorization never substitutes for Wise settlement", () => {
  const result = evaluateSchedulingGate({ matter: {
    ...unpaidDiscountedMatter,
    amount_due: 0,
    payment_disposition: "complimentary",
    comp_authorized: true,
    comp_authorization_id: "authorization",
    comp_authorized_at: "2026-10-25T00:00:00Z",
    verified_revenue: 0,
  } });
  assert.equal(result.schedulingEligible, false);
  assert.equal(result.paymentRequirementMethod, "not_satisfied");
});
