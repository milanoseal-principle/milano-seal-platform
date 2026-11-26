import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { activityMatchesAttempt } from "../lib/wise/attemptEvidence";

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
  assert.match(reconciliation, /isOptionalActivityCapabilityError\(error\)[\s\S]*onCapabilityError\?\.\(error\.status\);[\s\S]*return \[\]/);
  assert.match(reconciliation, /exactReferencePresent\(candidate, reference\)/);
  assert.match(observation, /export async function PUT/);
  assert.match(observation, /reconcileWiseMatter\(ctx\.deal\.id\)/);
});

test("Wise Activity uses its versioned v1 endpoint independently of the configured API version", () => {
  assert.ok(reconciliation.includes(
    'new URL(`/v1/profiles/${encodeURIComponent(profileId)}/activities?${query.toString()}`, WISE_API_BASE).href',
  ));
  assert.ok(!reconciliation.includes('wiseUrl(`/profiles/${encodeURIComponent(profileId)}/activities?'));
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
  assert.match(reconciliation, /record_wise_attempt_evidence/);
  assert.match(reconciliation, /record_wise_attempt_evidence/);
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
  assert.match(guards, /evaluateExecutionGate\(data\)/);
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

test("legacy observation cannot gain positive activity authority from a stored acquiring UUID", () => {
  const activity = {
    type: "ACQUIRING_TRANSACTION",
    createdOn: "2026-08-29T20:10:00Z",
    resource: { id: "9858e4b0-7dd5-4ed8-8bc5-7a3e850c2597", amount: { value: 6.88, currency: "USD" } },
  };
  const legacy = {
    id: "ee2e3dad-a95f-412d-ae87-15f634beed8e",
    wise_reference: "MS-SYNTHETIC-1",
    deal_id: "MS-SYNTHETIC-1",
    amount_due: 6.88,
    currency: "USD",
    payment_observed_at: "2026-08-29T20:08:02Z",
    wise_transaction_reference: activity.resource.id,
    wise_provider_evidence: null,
    payment_attempt_id: null,
    payment_attempt_started_at: null,
  };
  assert.equal(activityMatchesAttempt(activity, legacy), false);
  assert.equal(activityMatchesAttempt(activity, { ...legacy, payment_attempt_id: "synthetic-attempt" }), false);
  assert.equal(activityMatchesAttempt(activity, {
    ...legacy, payment_attempt_id: "synthetic-attempt", payment_attempt_started_at: legacy.payment_observed_at,
  }), true);
});
