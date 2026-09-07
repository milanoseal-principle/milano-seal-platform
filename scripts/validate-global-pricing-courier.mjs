import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const pricing = read("lib/pricing.ts");
const credit = read("lib/shippo/courierCredit.ts");
const rates = read("app/api/dashboard/shippo/rates/route.ts");
const labels = read("app/api/dashboard/shippo/labels/route.ts");
const payment = read("components/payments/SecurePaymentCard.tsx");

for (const amount of ["base: 750", "base: 975", "base: 1850"]) assert.match(pricing, new RegExp(amount));
assert.match(credit, /signature: 0/);
assert.match(credit, /priority: 5_000/);
assert.match(credit, /executive: 10_000/);
assert.match(credit, /Math\.min/);
assert.match(credit, /rateCents - creditCents/);
assert.match(rates, /createShippoShipment/);
assert.match(rates, /calculateCourierCharge/);
assert.match(labels, /shippo_rate_id: selected\.object_id/);
assert.match(labels, /provider_rate_amount/);
assert.match(labels, /tier_courier_credit/);
assert.match(labels, /client_courier_charge/);
assert.match(payment, /amount_due/);
assert.match(payment, /payment_observed_at/);
assert.doesNotMatch(credit + rates + labels + payment, /stripe/i);

console.log("PASS global pricing and courier continuity");
