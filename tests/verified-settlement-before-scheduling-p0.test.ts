// Founder decision 2026-11-09: NO VERIFIED WISE SETTLEMENT -> NO SCHEDULING.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateExecutionGate, evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";

const ronGuards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");
const ronReadiness = fs.readFileSync("components/ron/MatterRONReadiness.tsx", "utf8");
const alerts = fs.readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");

const base = {
  id: "matter-1", deal_id: "MS-1", amount_due: 500, amount_paid: 0, currency: "USD", wise_reference: "MS-1",
  payment_status: "unpaid", payment_confirmed: false, payment_settlement_status: null as string | null,
  payment_observed_at: null as string | null, payment_observed_amount: null as number | null,
  payment_observed_currency: null as string | null, payment_observed_reference: null as string | null,
};
const submitted = { ...base, payment_settlement_status: "observed_pending", payment_observed_at: "2026-11-09T00:00:00Z",
  payment_observed_amount: 500, payment_observed_currency: "USD", payment_observed_reference: "MS-1" };
const settled = { ...submitted, payment_status: "paid", payment_confirmed: true, payment_settlement_status: "cleared", amount_paid: 500 };

const DENIED: Array<[string, Record<string, unknown>]> = [
  ["submission only", submitted],
  ["observed only (projection incomplete)", { ...base, payment_settlement_status: "observed_pending", payment_observed_at: "2026-11-09T00:00:00Z" }],
  ["processing", { ...submitted, wise_provider_evidence: { status: "IN_PROGRESS" }, wise_transaction_reference: "r", payment_funding_method: "wise_acquiring_payment" }],
  ["pending", { ...submitted, payment_status: "pending" }],
  ["partial", { ...settled, amount_paid: 250 }],
  ["underpaid", { ...settled, amount_paid: 499.99 }],
  ["overpayment requiring review", { ...settled, amount_paid: 500.01 }],
  ["wrong currency", { ...submitted, payment_observed_currency: "EUR" }],
  ["wrong Matter / reference", { ...submitted, payment_observed_reference: "MS-OTHER" }],
  ["stale attempt (scope changed after submission)", { ...submitted, amount_due: 600 }],
  ["cancelled attempt", { ...submitted, payment_settlement_status: "cancelled" }],
  ["failed attempt", { ...submitted, payment_status: "failed", payment_settlement_status: "failed" }],
  ["flag-only payment_confirmed", { ...base, payment_confirmed: true }],
  ["flag-only payment_status=paid", { ...base, payment_status: "paid" }],
  ["paid + confirmed without cleared settlement", { ...settled, payment_settlement_status: "observed_pending" }],
  ["courtesy state without governed settlement", { ...base, amount_due: 0, payment_disposition: "complimentary", comp_authorized: true, comp_authorization_id: "c", comp_authorized_at: "2026-11-09T00:00:00Z" }],
];

for (const [label, matter] of DENIED) {
  test(`${label} → scheduling and execution DENIED`, () => {
    const gate = evaluateSchedulingGate({ matter });
    assert.equal(gate.schedulingEligible, false);
    assert.equal(gate.paymentRequirementSatisfied, false);
    assert.equal(gate.paymentRequirementMethod, "not_satisfied");
    assert.equal(evaluateExecutionGate(matter).schedulingEligible, false);
  });
}

test("exact verified cleared settlement → scheduling and execution ALLOWED", () => {
  const gate = evaluateSchedulingGate({ matter: settled });
  assert.equal(gate.schedulingEligible, true);
  assert.equal(gate.paymentRequirementMethod, "verified_payment");
  assert.equal(evaluateExecutionGate(settled).schedulingEligible, true);
});

test("submission is surfaced as processing so duplicate payments stay blocked, without authority", () => {
  assert.equal(evaluateSchedulingGate({ matter: submitted }).wiseSubmission, "processing");
});

test("evaluating the gate never mutates payment truth", () => {
  const copy = structuredClone(submitted);
  evaluateSchedulingGate({ matter: copy });
  evaluateExecutionGate(copy);
  assert.deepEqual(copy, submitted);
});

test("BlueNotary session creation consumes the canonical settlement-only scheduling gate", () => {
  assert.match(ronGuards, /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/);
  assert.match(ronReadiness, /Wise processing · scheduling locked until verified settlement/);
  assert.doesNotMatch(ronReadiness, /Wise submitted · scheduling authorized/);
});

test("operator and client notifications never say a submission authorizes scheduling", () => {
  assert.match(alerts, /Do not schedule yet/);
  assert.match(alerts, /Wise processing \/ settlement pending/);
  assert.match(alerts, /Do not represent the Matter as paid or settled/);
  assert.doesNotMatch(alerts, /can authorize scheduling|may authorize scheduling/);
  assert.match(alerts, /settlement-dependent final release remains protected until Wise settlement is verified/);
});
