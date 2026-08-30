import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ratesRoute = readFileSync("app/api/dashboard/shippo/rates/route.ts", "utf8");
const labelsRoute = readFileSync("app/api/dashboard/shippo/labels/route.ts", "utf8");
const optimizer = readFileSync("lib/shippo/rateSelection.ts", "utf8");
const controlRoom = readFileSync("components/dashboard/courier/MatterRateOptimizer.tsx", "utf8");

test("rate preview consumes canonical Matter tier and ranks only approved carriers", () => {
  assert.match(ratesRoute, /filterApprovedRates/);
  assert.match(ratesRoute, /rankApprovedRates/);
  assert.match(ratesRoute, /lane: matter\.tier/);
  assert.match(ratesRoute, /recommended_rate/);
});

test("label purchase verifies selected rate against Shippo shipment server-side", () => {
  assert.match(labelsRoute, /getShippoShipment/);
  assert.match(labelsRoute, /filterApprovedRates/);
  assert.match(labelsRoute, /SELECTED_RATE_NOT_APPROVED_FOR_SHIPMENT/);
  assert.match(labelsRoute, /actual_shippo_cost: actualShippoCost/);
});

test("recommended label can be auto-selected but still requires operator confirmation in UI", () => {
  assert.match(labelsRoute, /SHIPPO_RATE_AUTO_SELECTED/);
  assert.match(controlRoom, /Nothing is purchased until you confirm/);
  assert.match(controlRoom, /Confirm label purchase/);
  assert.doesNotMatch(controlRoom, /useEffect\([^)]*purchaseSelected/);
});

test("tier policy is deterministic and does not hardcode Italy to DHL", () => {
  assert.match(optimizer, /LOWEST_APPROVED_COST/);
  assert.match(optimizer, /BALANCED_PRIORITY/);
  assert.match(optimizer, /FASTEST_APPROVED/);
  assert.doesNotMatch(optimizer, /Italy|Damiani|\bIT\b\s*===\s*["']DHL/i);
});
