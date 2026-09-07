import assert from "node:assert/strict";
import test from "node:test";
import { TIERS } from "../lib/pricing";
import { calculateCourierCharge } from "../lib/shippo/courierCredit";
import { calculateMatterPricing, normalizeAuthenticationRoute } from "../lib/pricing/canonicalMatterPricing";

test("three execution tiers remain canonical and separate from courier economics", () => {
  assert.deepEqual(
    [TIERS.signature.base, TIERS.priority.base, TIERS.executive.base],
    [750, 975, 1850],
  );
});

test("Signature passes through the real provider rate", () => {
  assert.deepEqual(calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "Signature" }), {
    providerRateAmountCents: 6340, tierCourierCreditCents: 0, clientCourierChargeCents: 6340,
    providerRateAmount: "63.40", tierCourierCredit: "0.00", clientCourierCharge: "63.40", currency: "USD",
  });
});

test("Priority applies no more than fifty dollars", () => {
  assert.deepEqual(calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "Priority" }), {
    providerRateAmountCents: 6340, tierCourierCreditCents: 5000, clientCourierChargeCents: 1340,
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

test("unknown tiers fail closed and unknown routes require review", () => {
  assert.throws(() => calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "unknown" }), /INVALID_EXECUTION_TIER/);
  assert.equal(normalizeAuthenticationRoute("unknown"), "review_required");
});

test("canonical Matter pricing separates execution, route, courier credit, and payment plan", () => {
  const pricing = calculateMatterPricing({
    executionTier: "priority",
    authenticationRoute: "hague_apostille",
    authentication: [{ type: "hague_apostille", label: "Hague Apostille Coordination", amountCents: 25000, status: "confirmed", evidenceSource: "corridor_engine" }],
    shippoRate: { amount: "64.00", currency: "USD", carrier: "Provider", serviceLevel: "International", estimatedDays: 3, rateId: "rate_fixture" },
    discountCents: 0,
    paymentPlan: "split_50_50",
  });
  assert.equal(pricing.execution.amountCents, 97500);
  assert.equal(pricing.courier?.rateAmountCents, 6400);
  assert.equal(pricing.courier?.tierCreditCents, 5000);
  assert.equal(pricing.courier?.clientChargeCents, 1400);
  assert.equal(pricing.totalCents, 123900);
  assert.equal(pricing.amountDueNowCents, 61950);
  assert.equal(pricing.finalPriceConfirmed, true);
});

test("pending authority fees do not become confirmed zero-value pricing", () => {
  const pricing = calculateMatterPricing({
    executionTier: "executive",
    authenticationRoute: "consular_legalization",
    authentication: [{ type: "consular_government_fee", label: "Consular / Government Fee", amountCents: null, status: "pending_authority_confirmation", evidenceSource: "operator_review" }],
    shippoRate: { amount: "92.40", currency: "USD", carrier: "Provider", serviceLevel: "International", rateId: "rate_fixture" },
    discountCents: 0,
    paymentPlan: "full",
  });
  assert.equal(pricing.authentication[0].amountCents, null);
  assert.equal(pricing.courier?.clientChargeCents, 0);
  assert.equal(pricing.finalPriceConfirmed, false);
});
