import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// P0 regression: Milano uses a Wise Business personal API token, not partner OAuth/clientID.
// Acquiring Activity may be unavailable to this token. Activity is enrichment only;
// exact settled balance-statement evidence is the canonical machine settlement authority.
const reconciliation = fs.readFileSync("lib/wise/reconciliation.ts", "utf8");
const observation = fs.readFileSync("app/api/portal/me/payment-observation/route.ts", "utf8");
const cron = fs.readFileSync("app/api/cron/wise-payment-reconcile/route.ts", "utf8");
const guards = fs.readFileSync("lib/bluenotary/guards.ts", "utf8");
const vercel = fs.readFileSync("vercel.json", "utf8");

test("Wise personal-token reconciliation treats Activity as optional enrichment", () => {
  assert.match(reconciliation, /monetaryResourceType:\s*"ACQUIRING_PAYMENT"/);
  assert.match(reconciliation, /isOptionalActivityCapabilityError/);
  assert.match(reconciliation, /error\.status === 403 \|\| error\.status === 404/);
  assert.match(reconciliation, /if \(isOptionalActivityCapabilityError\(error\)\) return \[\]/);
  assert.match(reconciliation, /exactReferencePresent\(candidate, reference\)/);
  assert.match(observation, /export async function PUT/);
  assert.match(observation, /reconcileWiseMatter\(ctx\.deal\.id\)/);
});

test("Wise profile authority is token-validated, business-specific, and cached per runtime", () => {
  assert.match(reconciliation, /wiseGetJson<WiseProfile\[]>\(wiseUrl\("\/profiles"\), token\)/);
  assert.match(reconciliation, /businessProfiles\.length === 1/);
  assert.match(reconciliation, /WISE_PROFILE_ID does not belong to this Wise token/);
  assert.match(reconciliation, /resolvedConfigPromise/);
  assert.match(reconciliation, /resolveWiseConfigUncached\(\)\.catch/);
});

test("settled balance statement can verify payment without Acquiring Activity", () => {
  assert.match(reconciliation, /confirmFromStatement/);
  assert.match(reconciliation, /statementTransactionMatches/);
  assert.match(reconciliation, /exact matching settled Wise balance-statement credit/);
  assert.match(reconciliation, /Settled Wise balance-statement credit verified from exact Matter reference, currency, and gross amount/);
  assert.match(reconciliation, /confirm_wise_payment_for_deal/);
  assert.match(reconciliation, /p_actor:\s*"wise-statement-reconciliation"/);
});

test("provider observation never authors paid state before settled Wise evidence", () => {
  assert.match(reconciliation, /payment_settlement_status:\s*"observed_pending"/);
  assert.match(reconciliation, /payment_funding_method:\s*"wise_acquiring_payment"/);
  assert.doesNotMatch(reconciliation, /payment_status:\s*"paid"/);
  assert.doesNotMatch(reconciliation, /payment_confirmed:\s*true/);
});

test("Wise fee is reconciled as part of gross client obligation instead of false underpayment", () => {
  assert.match(reconciliation, /statementGrossAmount/);
  assert.match(reconciliation, /amount \+ fee/);
  assert.match(reconciliation, /sameMoney\(statementGrossAmount\(transaction\), amountDue\)/);
});

test("unsupported statement access fails closed instead of fabricating settlement", () => {
  assert.match(reconciliation, /Wise personal-token settlement evidence is not API-accessible; payment remains unconfirmed/);
  assert.match(reconciliation, /error\.status === 403 \|\| error\.status === 404/);
  assert.match(reconciliation, /confirmed:\s*false/);
});

test("provider processing cannot bypass the shared verified-settlement gate", () => {
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
