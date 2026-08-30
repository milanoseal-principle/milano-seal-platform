import assert from "node:assert/strict";
import test from "node:test";

import { rankApprovedRates, selectRecommendedRate } from "../lib/shippo/rateSelection";
import type { ShippoRate } from "../lib/shippo/types";

function rate(input: {
  id: string;
  provider: string;
  amount: string;
  days: number;
}): ShippoRate {
  return {
    object_id: input.id,
    provider: input.provider,
    servicelevel: { name: `${input.provider} service`, token: input.id },
    estimated_days: input.days,
    amount: input.amount,
    currency: "USD",
    amount_local: input.amount,
    currency_local: "USD",
  };
}

const internationalRates = [
  rate({ id: "dhl-fast", provider: "DHL Express", amount: "72.00", days: 2 }),
  rate({ id: "fedex-cheap", provider: "FedEx", amount: "49.00", days: 5 }),
  rate({ id: "ups-value", provider: "UPS", amount: "58.00", days: 3 }),
  rate({ id: "usps-slow", provider: "USPS", amount: "44.00", days: 9 }),
];

test("Signature chooses the lowest approved cost", () => {
  const selected = selectRecommendedRate({
    rates: internationalRates,
    lane: "signature",
    destinationCountry: "IT",
  });
  assert.equal(selected?.rate.object_id, "usps-slow");
  assert.equal(selected?.selectionPolicy, "LOWEST_APPROVED_COST");
});

test("Priority chooses fastest service inside governed value ceiling", () => {
  const selected = selectRecommendedRate({
    rates: internationalRates,
    lane: "priority",
    destinationCountry: "IT",
  });
  assert.equal(selected?.rate.object_id, "ups-value");
  assert.equal(selected?.selectionPolicy, "BALANCED_PRIORITY");
});

test("Executive chooses fastest approved service", () => {
  const selected = selectRecommendedRate({
    rates: internationalRates,
    lane: "executive",
    destinationCountry: "IT",
  });
  assert.equal(selected?.rate.object_id, "dhl-fast");
  assert.equal(selected?.selectionPolicy, "FASTEST_APPROVED");
});

test("all approved alternatives remain visible and ranked", () => {
  const ranked = rankApprovedRates({
    rates: internationalRates,
    lane: "priority",
    destinationCountry: "IT",
  });
  assert.equal(ranked.length, internationalRates.length);
  assert.equal(ranked.filter((item) => item.recommended).length, 1);
  assert.deepEqual(ranked.map((item) => item.rank), [1, 2, 3, 4]);
});
