import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const observation = fs.readFileSync("app/api/portal/me/payment-observation/route.ts", "utf8");
const invoice = fs.readFileSync("app/portal/invoice/page.tsx", "utf8");
const paymentCard = fs.readFileSync("components/payments/SecurePaymentCard.tsx", "utf8");
const paymentPage = fs.readFileSync("app/portal/payment/page.tsx", "utf8");
const portalContext = fs.readFileSync("components/portal/portal-context.tsx", "utf8");
const portalShell = fs.readFileSync("components/portal/portal-shell.tsx", "utf8");
const schedulingGate = fs.readFileSync("lib/scheduling/complimentarySchedulingGate.ts", "utf8");
const ronGuards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");

test("client submission requires a governed Milano-to-Wise handoff snapshot", () => {
  assert.match(observation, /export async function PATCH/);
  assert.match(observation, /WISE_PAYMENT_HANDOFF_OPENED/);
  assert.match(observation, /appendMatterEvidence/);
  assert.match(observation, /paymentUrlFingerprint/);
  assert.match(observation, /HANDOFF_MAX_AGE_MS/);
  assert.match(observation, /readMatterEvidence/);
  assert.match(observation, /Open this Matter's secure Wise payment from The Milano Seal before confirming payment/);
});

test("client cannot author financial truth from the payment-submission request", () => {
  const post = observation.slice(observation.indexOf("export async function POST"));
  assert.doesNotMatch(post, /payment_status:\s*"paid"/);
  assert.doesNotMatch(post, /payment_confirmed:\s*true/);
  assert.doesNotMatch(post, /amount_paid:/);
  assert.match(post, /payment_settlement_status:\s*"observed_pending"/);
});

test("already-observed production Matters remain idempotent without requiring a fabricated second handoff", () => {
  assert.match(observation, /currentState\.paymentObservedAt/);
  assert.match(observation, /Payment submission is already recorded\. You do not need to submit payment again/);
});

test("submitted state is projected client-safely across the portal", () => {
  assert.match(portalContext, /payment_settlement_status/);
  assert.match(portalContext, /payment_observed_at/);
  assert.match(portalShell, /paymentSubmitted/);
  assert.match(portalShell, /value:\s*paymentStatus/);
  assert.match(portalShell, /"Submitted"/);
});

test("payment card does not ask for duplicate payment and keeps scheduling settlement-gated", () => {
  assert.match(paymentCard, /isSubmitted/);
  assert.match(paymentCard, /Payment Submitted/);
  assert.match(paymentCard, /Payment submitted successfully/);
  assert.match(paymentCard, /You do not need to submit payment again/);
  assert.match(paymentCard, /Scheduling stays locked until verified Wise settlement and the remaining Matter requirements are ready/);
  assert.doesNotMatch(paymentCard, /Scheduling unlocks automatically after verified payment/);
});

test("payment page keeps Wise submission distinct from scheduling authority", () => {
  assert.match(paymentPage, /Scheduling stays locked until the exact Milano payment is verified as settled/);
  assert.match(paymentPage, /A submitted or pending payment does not authorize scheduling/);
  assert.match(paymentPage, /PolicyAcceptanceGate matterId=\{deal\.id\}/);
});

test("invoice settlement check performs live server-side Wise reconciliation", () => {
  const check = invoice.slice(invoice.indexOf("async function checkWiseSettlement"), invoice.indexOf("if (isLoading || loadingInvoice)"));
  assert.match(check, /method:\s*"PUT"/);
  assert.match(check, /\/api\/portal\/me\/payment-observation/);
  assert.match(invoice, /Payment submitted/);
  assert.match(invoice, /You do not need to submit payment again/);
  assert.match(invoice, /Check Wise settlement now/);
  assert.doesNotMatch(invoice, /Wise payment processing/);
});

test("canonical scheduler rejects submission without ever authoring paid state", () => {
  assert.match(schedulingGate, /classifyObservedSubmission/);
  assert.match(schedulingGate, /observed_pending/);
  assert.match(schedulingGate, /submission === "observed"/);
  assert.match(schedulingGate, /schedulingEligible:\s*false/);
  assert.match(schedulingGate, /paymentRequirementSatisfied:\s*false/);
  assert.match(schedulingGate, /scheduling remains locked until verified Wise settlement/);
  assert.doesNotMatch(schedulingGate, /payment_status\s*[:=]\s*["']paid["']/);
  assert.doesNotMatch(schedulingGate, /payment_confirmed\s*[:=]\s*true/);
  assert.doesNotMatch(schedulingGate, /amount_paid\s*[:=]\s*(?!params\.matter)/);
});

test("scheduling authority fails closed when the payable scope is mutated after submission", () => {
  assert.match(schedulingGate, /payment_observed_amount/);
  assert.match(schedulingGate, /payment_observed_currency/);
  assert.match(schedulingGate, /payment_observed_reference/);
  assert.match(schedulingGate, /projection_incomplete/);
  assert.match(schedulingGate, /superseded/);
  const post = observation.slice(observation.indexOf("export async function POST"));
  assert.match(post, /payment_observed_amount:\s*snapshot\.amountDue/);
  assert.match(post, /payment_observed_currency:\s*snapshot\.currency/);
  assert.match(post, /payment_observed_reference:\s*snapshot\.wiseReference/);
});

test("RON continues to consume the canonical scheduling gate and keeps notarial readiness independent", () => {
  assert.match(ronGuards, /evaluateSchedulingGate/);
  assert.match(ronGuards, /verifyExecutionPaymentAuthorized/);
  assert.match(ronGuards, /notarial_act/);
  assert.match(ronGuards, /review_required/i);
});
