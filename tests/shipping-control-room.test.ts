import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

// Regression lock: shipping UX may evolve, but Shippo/custody/release authority stays singular.
const courierPage = readFileSync("app/dashboard/courier/page.tsx", "utf8");
const shippingCompatibility = readFileSync("app/dashboard/shipping/page.tsx", "utf8");
const deck = readFileSync("components/dashboard/courier/ShippingControlDeck.tsx", "utf8");
const carrierPolicy = readFileSync("lib/shippo/carrierPolicy.ts", "utf8");
const webhook = readFileSync("app/api/courier/webhook/route.ts", "utf8");

test("shipping has one canonical operator surface", () => {
  assert.match(courierPage, /Shipping Control Room/);
  assert.match(courierPage, /ShippingControlDeck/);
  assert.match(shippingCompatibility, /redirect\("\/dashboard\/courier"\)/);
  assert.doesNotMatch(shippingCompatibility, /fetch\("\/api\/dashboard\/shippo\/shipments"\)/);
});

test("carrier policy keeps the approved Milano stack and governed override", () => {
  for (const carrier of ["DHL Express", "FedEx", "UPS", "USPS"]) {
    assert.match(carrierPolicy, new RegExp(carrier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(carrierPolicy, /CARRIER_OVERRIDE_APPROVED/);
  assert.match(deck, /Approved operator stack/);
  assert.match(deck, /Controlled override/);
});

test("Shippo delivery evidence has one authenticated atomic authority", () => {
  assert.equal(existsSync("app/api/webhooks/shippo/route.ts"), false);
  assert.match(webhook, /verifyShippoHmac/);
  assert.match(webhook, /record_courier_delivery_transition/);
  assert.doesNotMatch(webhook, /payment_confirmed\s*:/);
  assert.doesNotMatch(webhook, /updates\.deal_status/);
  assert.match(deck, /Delivery never authors final release or Matter completion/);
});

test("shipping control room does not introduce fake tracking telemetry", () => {
  assert.doesNotMatch(deck, /fake GPS|99\.\d%|position #\d+|queue #\d+/i);
  assert.match(deck, /without inventing ETA or GPS truth/);
});
