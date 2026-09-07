import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const pricing = read("lib/pricing.ts");
const credit = read("lib/shippo/courierCredit.ts");
const rates = read("app/api/dashboard/shippo/rates/route.ts");
const labels = read("app/api/dashboard/shippo/labels/route.ts");
const payment = read("components/payments/SecurePaymentCard.tsx");
const matterPricing = read("lib/pricing/canonicalMatterPricing.ts");
const migration = read("supabase/migrations/074_shippo_prepayment_rate_continuity.sql");

for (const amount of ["base: 750", "base: 975", "base: 1850"]) assert.match(pricing, new RegExp(amount));
assert.match(credit, /signature: 0/);
assert.match(credit, /priority: 5_000/);
assert.match(credit, /executive: 10_000/);
assert.match(credit, /Math\.min/);
assert.match(credit, /rateCents - creditCents/);
assert.match(rates, /createShippoShipment/);
assert.doesNotMatch(rates, /assertPaymentConfirmed/);
assert.match(rates, /export async function PATCH/);
assert.match(rates, /SHIPPING_ADJUSTMENT_REQUIRED/);
assert.match(rates, /pricing_snapshot_hash/);
assert.match(rates, /calculateCourierCharge/);
assert.match(labels, /shippo_rate_id: selected\.object_id/);
assert.match(labels, /provider_rate_amount/);
assert.match(labels, /tier_courier_credit/);
assert.match(labels, /client_courier_charge/);
assert.match(labels, /persistedShipment/);
assert.match(labels, /\.update\(shipmentRecord\)/);
assert.match(labels, /SHIPPO_RATE_UNAVAILABLE/);
for (const field of ["provider_rate_amount", "tier_courier_credit", "client_courier_charge", "pricing_snapshot_hash", "rate_status"]) {
  assert.match(migration, new RegExp(field));
}
assert.match(payment, /amount_due/);
assert.match(payment, /payment_observed_at/);
assert.doesNotMatch(credit + rates + labels + payment, /stripe/i);
for (const route of ["hague_apostille", "state_authentication", "federal_authentication", "consular_legalization", "mixed_route", "review_required"]) {
  assert.match(matterPricing, new RegExp(route));
}
assert.match(matterPricing, /finalPriceConfirmed/);
assert.match(matterPricing, /pending_authority_confirmation/);
assert.match(matterPricing, /TIERS\[tier\]\.base/);
assert.doesNotMatch(matterPricing, /Europe|Middle East|Asia|Latin America/);

console.log("PASS global pricing and courier continuity");
