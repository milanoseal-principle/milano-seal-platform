import { test } from "node:test";
import assert from "node:assert/strict";
import { priceCanonicalMatter } from "../priceCanonicalMatter";
import {
  projectClientPricing,
  projectOperatorPricing,
  projectFounderPricing,
} from "../pricingProjections";

const approved = () =>
  priceCanonicalMatter({
    executionTier: "Priority",
    destinationCountry: "Italy",
    apostilleStatus: "required",
    ron: true,
  });
const review = () =>
  priceCanonicalMatter({
    destinationCountry: "Italy",
    apostilleStatus: "required",
  });

test("client projection shows approved amount from canonical result (not hard-coded)", () => {
  const p = projectClientPricing(approved());
  assert.equal(p.mode, "approved_price");
  assert.equal(p.amount, 1250);
  assert.equal(p.paymentGateRequired, true);
});

test("client projection exposes no internal fields", () => {
  const json = JSON.stringify(projectClientPricing(approved()));
  assert.ok(
    !/manualReviewReasons|pricingConfidence|laneBase|authorizedAddOns|additionalSignerCount/.test(
      json,
    ),
  );
});

test("apostille-only review → quote_after_review, no fabricated amount", () => {
  const p = projectClientPricing(review());
  assert.equal(p.mode, "quote_after_review");
  assert.equal(p.amount, undefined);
});

test("all three projections read the SAME underlying approved result", () => {
  const r = approved();
  assert.equal(projectFounderPricing(r), r);
  assert.equal(projectOperatorPricing(r).total, r.total);
  assert.equal(projectClientPricing(r).amount, r.total);
  assert.notEqual(r.total, null);
});

test("all three projections preserve review instead of inventing a price", () => {
  const r = review();
  assert.equal(projectFounderPricing(r), r);
  assert.equal(projectOperatorPricing(r).total, null);
  assert.equal(projectClientPricing(r).mode, "quote_after_review");
  assert.equal(projectClientPricing(r).amount, undefined);
});
