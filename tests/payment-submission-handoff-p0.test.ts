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

test("payment card never tells a submitted client to pay again or wait for verified payment to schedule", () => {
  assert.match(paymentCard, /isSubmitted/);
  assert.match(paymentCard, /Payment Submitted/);
  assert.match(paymentCard, /Payment submitted successfully/);
  assert.match(paymentCard, /You do not need to submit payment again/);
  assert.match(paymentCard, /Scheduling access is available when the remaining Matter requirements are ready/);
  assert.doesNotMatch(paymentCard, /Scheduling unlocks automatically after verified payment/);
});

test("payment page describes submission and settlement as separate authorities", () => {
  assert.match(paymentPage, /governed Wise submission is recorded/);
  assert.match(paymentPage, /payment portion of scheduling is satisfied/);
  assert.doesNotMatch(paymentPage, /Scheduling remains locked until verified Wise reconciliation/);
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

test("canonical scheduler already accepts observed submission without fabricating paid state", () => {
  assert.match(schedulingGate, /hasObservedWiseSubmission/);
  assert.match(schedulingGate, /observed_pending/);
  assert.match(schedulingGate, /schedulingEligible:\s*true/);
  assert.match(schedulingGate, /paymentRequirementSatisfied:\s*true/);
  assert.match(schedulingGate, /paymentRequirementMethod:\s*"wise_submission_observed"/);
  assert.match(schedulingGate, /MUST NOT mark the Matter paid/);
});

test("RON continues to consume the canonical scheduling gate and keeps notarial readiness independent", () => {
  assert.match(ronGuards, /evaluateSchedulingGate/);
  assert.match(ronGuards, /verifyExecutionPaymentAuthorized/);
  assert.match(ronGuards, /notarial_act/);
  assert.match(ronGuards, /review_required/i);
});
