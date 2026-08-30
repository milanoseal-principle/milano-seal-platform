import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const courierPage = readFileSync("app/dashboard/courier/page.tsx", "utf8");
const shippingCompatibility = readFileSync("app/dashboard/shipping/page.tsx", "utf8");
const deck = readFileSync("components/dashboard/courier/ShippingControlDeck.tsx", "utf8");
const carrierPolicy = readFileSync("lib/shippo/carrierPolicy.ts", "utf8");
const webhook = readFileSync("app/api/webhooks/shippo/route.ts", "utf8");

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

test("delivery evidence cannot auto-author release or completion", () => {
  assert.match(webhook, /DELIVERED never auto-completes or auto-releases/);
  assert.match(deck, /Delivery never authors final release or Matter completion/);
  assert.doesNotMatch(webhook, /payment_confirmed\s*:/);
});

test("shipping control room does not introduce fake tracking telemetry", () => {
  assert.doesNotMatch(deck, /fake GPS|99\.\d%|position #\d+|queue #\d+/i);
  assert.match(deck, /without inventing ETA or GPS truth/);
});
