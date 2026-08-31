import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const reconciliation = fs.readFileSync("lib/wise/reconciliation.ts", "utf8");
const observation = fs.readFileSync("app/api/portal/me/payment-observation/route.ts", "utf8");
const cron = fs.readFileSync("app/api/cron/wise-payment-reconcile/route.ts", "utf8");
const guards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");
const vercel = fs.readFileSync("vercel.json", "utf8");

test("Wise reconciliation reads acquiring payment activity from Wise instead of pretending DB refresh is provider verification", () => {
  assert.match(reconciliation, /monetaryResourceType:\s*"ACQUIRING_PAYMENT"/);
  assert.match(reconciliation, /\/profiles\/\$\{encodeURIComponent\(profileId\)\}\/activities/);
  assert.match(reconciliation, /exactReferencePresent\(activity, reference\)/);
  assert.match(observation, /export async function PUT/);
  assert.match(observation, /reconcileWiseMatter\(ctx\.deal\.id\)/);
});

test("provider observation never authors paid state before settled Wise evidence", () => {
  assert.match(reconciliation, /payment_settlement_status:\s*"observed_pending"/);
  assert.match(reconciliation, /payment_funding_method:\s*"wise_acquiring_payment"/);
  assert.doesNotMatch(reconciliation, /payment_status:\s*"paid"/);
  assert.doesNotMatch(reconciliation, /payment_confirmed:\s*true/);
  assert.match(reconciliation, /confirm_wise_payment_for_deal/);
  assert.match(reconciliation, /statementTransactionMatches/);
});

test("Wise fee is reconciled as part of gross client obligation instead of false underpayment", () => {
  assert.match(reconciliation, /statementGrossAmount/);
  assert.match(reconciliation, /amount \+ fee/);
  assert.match(reconciliation, /sameMoney\(statementGrossAmount\(transaction\), amountDue\)/);
});

test("provider-evidenced processing can execute while final paid truth remains separate", () => {
  assert.match(guards, /verifyExecutionPaymentAuthorized/);
  assert.match(guards, /wise_transaction_reference/);
  assert.match(guards, /payment_funding_method === 'wise_acquiring_payment'/);
  assert.match(guards, /assertCanReleaseSigningURL[\s\S]*verifyExecutionPaymentAuthorized/);
  assert.match(guards, /assertCanAdvanceToApostille[\s\S]*verifyExecutionPaymentAuthorized/);
  assert.match(guards, /Final international release remains governed/);
});

test("automatic reconciliation runs every minute behind the cron secret", () => {
  assert.match(cron, /Bearer \$\{expected\}/);
  assert.match(cron, /reconcileObservedWisePayments/);
  assert.match(vercel, /\/api\/cron\/wise-payment-reconcile/);
  assert.match(vercel, /"schedule"\s*:\s*"\* \* \* \* \*"/);
});
