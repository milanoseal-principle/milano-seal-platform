import assert from "node:assert/strict";
import test from "node:test";
import { TIERS } from "../lib/pricing";
import { calculateCourierCharge } from "../lib/shippo/courierCredit";
import { calculateMatterPricing, normalizeAuthenticationRoute } from "../lib/pricing/canonicalMatterPricing";
import { readFileSync } from "node:fs";

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

test("locked courier examples use exact integer-cent economics", () => {
  const fixtures = [
    ["signature", "71.85", 0, 7185],
    ["priority", "71.85", 5000, 2185],
    ["priority", "32.00", 3200, 0],
    ["executive", "92.40", 9240, 0],
    ["executive", "140.00", 10000, 4000],
  ] as const;
  for (const [tier, amount, credit, charge] of fixtures) {
    const result = calculateCourierCharge({ providerRateAmount: amount, currency: "USD", tier });
    assert.equal(result.tierCourierCreditCents, credit);
    assert.equal(result.clientCourierChargeCents, charge);
  }
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

test("prepayment rate preview remains operator-governed without authoring payment or custody truth", () => {
  const route = readFileSync("app/api/dashboard/shippo/rates/route.ts", "utf8");
  assert.match(route, /if \(!user\?\.email\).*401/);
  assert.match(route, /founder_admin.*admin_operator/);
  assert.doesNotMatch(route, /assertPaymentConfirmed/);
  assert.doesNotMatch(route, /paid_and_released\s*:/);
  assert.doesNotMatch(route, /purchaseShippoLabel/);
  assert.doesNotMatch(route, /tracking_number\s*:/);
  assert.doesNotMatch(route, /custody_events/);
});

test("label creation continues the persisted shipment row and rejects rate substitution", () => {
  const route = readFileSync("app/api/dashboard/shippo/labels/route.ts", "utf8");
  assert.match(route, /persistedShipment\?\.shippo_rate_id/);
  assert.match(route, /SHIPPO_RATE_SELECTION_MISMATCH/);
  assert.match(route, /\.update\(shipmentRecord\)\.eq\("id", persistedShipment\.id\)/);
  assert.match(route, /SHIPPO_RATE_UNAVAILABLE/);
});
