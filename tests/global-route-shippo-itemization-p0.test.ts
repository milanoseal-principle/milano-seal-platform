import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { projectAuthenticationPricing } from "../src/features/pricing/globalRoutePricing";
import { calculateCourierCharge } from "../lib/shippo/courierCredit";

const migration = fs.readFileSync("supabase/migrations/078_global_route_shippo_pricing.sql", "utf8");
const rates = fs.readFileSync("app/api/dashboard/shippo/rates/route.ts", "utf8");
const selection = fs.readFileSync("app/api/dashboard/shippo/rates/select/route.ts", "utf8");
const labels = fs.readFileSync("app/api/dashboard/shippo/labels/route.ts", "utf8");
const gates = fs.readFileSync("lib/shippo/gates.ts", "utf8");
const invoiceRoute = fs.readFileSync("app/api/portal/me/invoice/route.ts", "utf8");
const invoiceProjection = fs.readFileSync("lib/portalInvoice.ts", "utf8");

test("three Milano tiers keep deterministic provider-backed courier credits", () => {
  assert.deepEqual(
    calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "Signature" }),
    { providerRateAmount: "63.40", tierCourierCredit: "0.00", clientCourierCharge: "63.40", currency: "USD" },
  );
  assert.equal(
    calculateCourierCharge({ providerRateAmount: "63.40", currency: "USD", tier: "Priority" }).clientCourierCharge,
    "13.40",
  );
  assert.equal(
    calculateCourierCharge({ providerRateAmount: "192.40", currency: "USD", tier: "Executive" }).clientCourierCharge,
    "92.40",
  );
});

test("Hague route may use canonical apostille coordination while non-Hague fees fail closed", () => {
  const hague = projectAuthenticationPricing({ route: "hague_apostille", apostilleRequired: true });
  assert.equal(hague.status, "priced");
  assert.equal(hague.items[0]?.amount, 275);

  const nonHague = projectAuthenticationPricing({ route: "non_hague_consular_legalization" });
  assert.equal(nonHague.status, "pending_authority_confirmation");
  assert.equal(nonHague.items[0]?.amount, null);

  const federal = projectAuthenticationPricing({ route: "federal_authentication" });
  assert.equal(federal.status, "pending_authority_confirmation");
  assert.equal(federal.items[0]?.amount, null);
});

test("Shippo rate selection is pre-Wise, provider-backed, persisted and locked after submission", () => {
  assert.doesNotMatch(rates, /assertPaymentConfirmed/);
  assert.match(rates, /createShippoShipment/);
  assert.match(rates, /lane/);
  assert.doesNotMatch(rates, /matter\.tier/);
  assert.match(selection, /getShippoShipment/);
  assert.match(selection, /applySelectedShippoRate/);
  assert.match(migration, /COURIER_PRICING_LOCKED_AFTER_WISE_SUBMISSION/);
  assert.match(migration, /payment_observed_at is not null/);
  assert.match(migration, /provider_rate_amount/);
  assert.match(migration, /tier_courier_credit/);
  assert.match(migration, /client_courier_charge/);
});

test("quote and label use one canonical Shippo shipment row", () => {
  assert.match(migration, /unique index if not exists ux_shippo_shipments_shippo_shipment_id/i);
  assert.match(migration, /on conflict \(shippo_shipment_id\)/i);
  assert.match(labels, /courier_shippo_shipment_id/);
  assert.match(labels, /courier_shippo_rate_id/);
  assert.match(labels, /PERSISTED_QUOTE/);
  assert.match(labels, /\.update\(\{/);
  assert.doesNotMatch(labels, /from\("shippo_shipments"\)\.insert/);
});

test("label release gate uses canonical status and apostille evidence rather than circular transit state", () => {
  assert.match(gates, /status\?: string/);
  assert.doesNotMatch(gates, /matter_status/);
  assert.doesNotMatch(gates, /paid_and_released/);
  assert.match(gates, /apostille_complete/);
  assert.match(labels, /DOC_APOSTILLE_RECEIVED/);
});

test("portal invoice derives authentication route from existing global acceptance authority", () => {
  assert.match(invoiceRoute, /runGlobalAcceptanceReview/);
  assert.match(invoiceRoute, /authentication_route/);
  assert.match(invoiceProjection, /projectAuthenticationPricing/);
  assert.match(invoiceProjection, /courierProviderRate|courier_provider_rate/);
  assert.match(invoiceProjection, /tierCredit/);
  assert.match(invoiceProjection, /clientCharge/);
});

test("global route pricing and shipping remain Wise-only and do not introduce a second authority", () => {
  const all = [migration, rates, selection, labels, invoiceRoute, invoiceProjection].join("\n");
  assert.doesNotMatch(all, /stripe/i);
  assert.doesNotMatch(all, /paypal/i);
  assert.match(invoiceRoute, /runGlobalAcceptanceReview/);
});
