import { test } from "node:test";
import assert from "node:assert/strict";
import { REVENUE_CHANNELS, getRevenueChannel } from "@/lib/revenue-stack/channelRegistry";
import { actualRevenue, quotedValue, containsBannedRevenuePublic } from "@/lib/revenue-stack/revenueSafety";
import { realPaidRevenue, isActualRevenueEvent } from "@/lib/revenue-stack/revenueOpportunity";

test("all ten revenue channels are registered", () => {
  assert.equal(REVENUE_CHANNELS.length, 10);
  assert.ok(getRevenueChannel("maritime_logistics"));
  assert.ok(getRevenueChannel("government_procurement"));
});

test("maritime & government channels reuse existing verticals", () => {
  assert.match(getRevenueChannel("maritime_logistics")!.reusesVertical!, /maritime/);
  assert.match(getRevenueChannel("government_procurement")!.reusesVertical!, /procurement/);
});

test("actual revenue requires verified payment; quotes are not paid", () => {
  const entries = [
    { paid: true, amount: 1000 },
    { paid: false, amount: 5000 }, // quote only
    { paid: true, amount: 500, isSample: true }, // sample excluded
  ];
  assert.equal(actualRevenue(entries), 1000);
  assert.equal(quotedValue(entries.map((e) => ({ amount: e.amount, isSample: e.isSample }))), 6000);
});

test("only payment_confirmed counts as actual revenue", () => {
  assert.equal(isActualRevenueEvent("payment_confirmed"), true);
  assert.equal(isActualRevenueEvent("quote_sent"), false);
  assert.equal(isActualRevenueEvent("matter_completed"), false);
});

test("empty registry yields zero real paid revenue (honest empty state)", () => {
  assert.equal(realPaidRevenue(), 0);
});

test("banned public revenue phrases are detected", () => {
  assert.equal(containsBannedRevenuePublic("guaranteed savings"), true);
  assert.equal(containsBannedRevenuePublic("internal margin 40%"), true);
  assert.equal(containsBannedRevenuePublic("custom scope after review"), false);
});
