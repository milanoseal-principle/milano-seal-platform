import assert from "node:assert/strict";
import test from "node:test";
import { TIERS } from "../lib/pricing";
import { calculateCourierCharge } from "../lib/shippo/courierCredit";

test("three execution tiers remain canonical and separate from courier economics", () => {
  assert.deepEqual(
    [TIERS.signature.base, TIERS.priority.base, TIERS.executive.base],
    [750, 975, 1850],
  );
});

test("Signature passes through the real provider rate", () => {
  assert.deepEqual(calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "Signature" }), {
    providerRateAmount: "63.40", tierCourierCredit: "0.00", clientCourierCharge: "63.40", currency: "USD",
  });
});

test("Priority applies no more than fifty dollars", () => {
  assert.deepEqual(calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "Priority" }), {
    providerRateAmount: "63.40", tierCourierCredit: "50.00", clientCourierCharge: "13.40", currency: "USD",
  });
  assert.equal(calculateCourierCharge({ providerRateAmount: "12.10", currency: "USD", tier: "Priority" }).clientCourierCharge, "0.00");
});

test("Executive applies no more than one hundred dollars", () => {
  const result = calculateCourierCharge({ providerRateAmount: "192.40", currency: "USD", tier: "Executive" });
  assert.equal(result.tierCourierCredit, "100.00");
  assert.equal(result.clientCourierCharge, "92.40");
});

test("provider rates fail closed instead of using floating point or currency conversion", () => {
  assert.throws(() => calculateCourierCharge({ providerRateAmount: "unknown", currency: "USD", tier: "Priority" }), /INVALID_PROVIDER_RATE/);
  assert.throws(() => calculateCourierCharge({ providerRateAmount: "63.40", currency: "EUR", tier: "Priority" }), /COURIER_CURRENCY_REVIEW_REQUIRED/);
});
